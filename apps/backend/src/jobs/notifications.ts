import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { pool } from '../database/postgres';
import { config } from '../config';

// PostgreSQL outbox remains authoritative if Redis restarts. Jobs contain opaque IDs only.
export function startWorker(options: { queueName?: string; failNotificationId?: string } = {}) {
  const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });
  connection.on('error', () => console.error(JSON.stringify({ event: 'redis_unavailable' })));
  const queueName = options.queueName || 'medicore-notifications';
  const queue = new Queue(queueName, { connection: connection as any });
  const workerConnection = connection.duplicate();
  workerConnection.on('error', () => console.error(JSON.stringify({ event: 'worker_redis_unavailable' })));
  const worker = new Worker(queueName, async job => {
    const { rows } = await pool.query('SELECT * FROM "Notification" WHERE id=$1', [job.data.notificationId]);
    if (!rows.length) return;
    if (options.failNotificationId === job.data.notificationId) throw new Error('Controlled incident simulation');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(763421)');
      const existing = await client.query('SELECT status FROM "NotificationDelivery" WHERE "notificationId"=$1 FOR UPDATE', [rows[0].id]);
      if (existing.rows[0]?.status !== 'SENT') {
        // Explicit local EMAIL/SMS simulator: never contact a real patient or payment provider.
        await client.query(`INSERT INTO "NotificationDelivery" (id, "notificationId", attempts, status, "deliveredAt")
          VALUES ($1,$1,1,'SENT',now()) ON CONFLICT ("notificationId") DO UPDATE
          SET attempts="NotificationDelivery".attempts+1,status='SENT',"deliveredAt"=now(),"updatedAt"=now()`, [rows[0].id]);
        await client.query(`UPDATE "Notification" SET status='SENT',"sentAt"=now() WHERE id=$1 AND status='PENDING'`, [rows[0].id]);
      }
      await client.query('COMMIT');
      console.log(JSON.stringify({ event: 'sandbox_notification_delivered', channel: rows[0].channel, jobId: job.id }));
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }, { connection: workerConnection as any, concurrency: 2 });
  worker.on('error', () => console.error(JSON.stringify({ event: 'notification_worker_error' })));
  worker.on('failed', async job => {
    if (job) await pool.query(`INSERT INTO "NotificationDelivery" (id,"notificationId",attempts,status,"lastError")
      VALUES ($1,$1,$2,'FAILED','Sandbox delivery failed') ON CONFLICT ("notificationId") DO UPDATE
      SET attempts=$2,status='FAILED',"lastError"='Sandbox delivery failed',"updatedAt"=now()`, [job.data.notificationId, job.attemptsMade]).catch(() => undefined);
  });
  let polling = false;
  const poll = async () => {
    if (polling || connection.status !== 'ready') return;
    polling = true;
    try {
      const { rows } = await pool.query(`SELECT n.id FROM "Notification" n LEFT JOIN "NotificationDelivery" d ON d."notificationId"=n.id
        WHERE n.status='PENDING' AND n.channel IN ('EMAIL','SMS') AND (d.status IS NULL OR d.status!='SENT') LIMIT 100`);
      for (const row of rows) await queue.add('sandbox-delivery', { notificationId: row.id }, {
        jobId: row.id, attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 500, removeOnFail: 500
      });
    } catch { console.error(JSON.stringify({ event: 'notification_outbox_unavailable' })); }
    finally { polling = false; }
  };
  const interval = setInterval(poll, 2000); void poll();
  return async () => { clearInterval(interval); await worker.close(); await queue.close(); await workerConnection.quit(); await connection.quit(); };
}

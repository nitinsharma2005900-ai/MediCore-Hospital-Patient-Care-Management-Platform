import { createApp } from './app';
import { config } from './config';
import { seedDatabase } from './database/seed';
import { store } from './database/store';
import { migrate } from './database/migrate';
import { pool, withDatabase } from './database/postgres';

async function bootstrap() {
  await migrate();
  if (process.env.SEED_DEMO === 'true') await withDatabase(async () => {
    if (!store.users.length) await seedDatabase();
  });
  const app = createApp();
  const server = app.listen(config.port, '0.0.0.0', () =>
    console.log(JSON.stringify({ event: 'server_started', port: config.port, database: 'postgres' })));
  let stopWorker: (() => Promise<void>) | undefined;
  if (process.env.RUN_WORKER === 'true') {
    const { startWorker } = await import('./jobs/notifications');
    stopWorker = startWorker();
  }
  const shutdown = () => server.close(async () => {
    await stopWorker?.(); await pool.end(); process.exit(0);
  });
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
}
bootstrap().catch((error: any) => {
  console.error(JSON.stringify({ event: 'bootstrap_failed', code: error.code || error.name })); process.exit(1);
});

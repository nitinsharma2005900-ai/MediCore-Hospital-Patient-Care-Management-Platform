const path=require('node:path');const fs=require('node:fs');const{spawn,execFileSync}=require('node:child_process');const{randomUUID}=require('node:crypto');const assert=require('node:assert/strict');
const{pool}=require('../apps/backend/dist/database/postgres');const{config}=require('../apps/backend/dist/config');const{startWorker}=require('../apps/backend/dist/jobs/notifications');const{Queue}=require('bullmq');const IORedis=require('ioredis');
const root=path.resolve(__dirname,'..');const runtime=path.join(root,'.runtime');const pgBin=process.env.POSTGRES_BIN||'C:\\Users\\amits\\Documents\\FinCore\\.tools\\pgsql\\bin';const redisDir=process.env.REDIS_BIN||'C:\\Users\\amits\\Documents\\FinCore\\.tools\\redis\\Redis-8.10.3-Windows-x64-cygwin-with-Service';
const results=[];let stopWorker;let redisStopped=false;let pgStopped=false;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(action){for(let n=0;n<60;n++){try{if(await action())return;}catch{}await pause(500);}throw Error('Recovery verification timed out');}
async function check(name,action){try{await action();results.push({name,status:'passed'});console.log('PASS '+name);}catch(e){results.push({name,status:'failed',message:e.message});console.log('FAIL '+name+' '+e.message);}}
const psql=(sql,values=[])=>pool.query(sql,values);
const pgAction=action=>execFileSync(path.join(pgBin,'pg_ctl.exe'),[action,'-D',path.join(runtime,'postgres'),...(action==='start'?['-l',path.join(runtime,'postgres.log'),'-o','-h 127.0.0.1 -p 5546']:['-m','fast']),'-w'],{windowsHide:true,stdio:'ignore',timeout:30000});
function restartRedis(){const proc=spawn(path.join(redisDir,'redis-server.exe'),['--bind','127.0.0.1','--port','6386','--appendonly','yes','--dir',path.join(runtime,'redis')],{windowsHide:true,detached:true,stdio:'ignore'});proc.unref();redisStopped=false;}
(async()=>{
 assert.equal(new URL(config.database.url).port,'5546','Only the session-owned PostgreSQL cluster may be stopped');assert.equal(new URL(config.redis.url).port,'6386','Only the session-owned Redis instance may be stopped');
 const user=(await psql(`SELECT id FROM "User" WHERE email='patient@medicore.health'`)).rows[0].id;
 const failedId=randomUUID();const queueName='medicore-incident-'+randomUUID();stopWorker=startWorker({queueName,failNotificationId:failedId});
 const add=async(id,channel='EMAIL')=>psql(`INSERT INTO "Notification" (id,"userId",title,message,channel,status,"createdAt") VALUES($1,$2,'Synthetic reliability verification','Local simulator only',$3,'PENDING',now())`,[id,user,channel]);
 await check('Failed notification jobs retry three times and record failure',async()=>{await add(failedId);await until(async()=>{const r=await psql('SELECT attempts,status FROM "NotificationDelivery" WHERE "notificationId"=$1',[failedId]);return r.rows[0]?.status==='FAILED'&&r.rows[0]?.attempts===3;});});
 await check('Controlled notification recovery delivers exactly once',async()=>{
  await stopWorker();stopWorker=startWorker({queueName});const connection=new IORedis(config.redis.url,{maxRetriesPerRequest:1});const queue=new Queue(queueName,{connection});
  try{const job=await queue.getJob(failedId);await job.retry('failed');await until(async()=>{const r=await psql('SELECT status FROM "NotificationDelivery" WHERE "notificationId"=$1',[failedId]);return r.rows[0]?.status==='SENT';});await queue.add('duplicate',{notificationId:failedId},{jobId:failedId});const r=await psql('SELECT count(*)::int n FROM "NotificationDelivery" WHERE "notificationId"=$1',[failedId]);assert.equal(r.rows[0].n,1);}finally{await queue.close();await connection.quit();}
 });
 await check('Redis outage preserves the PostgreSQL outbox and recovers delivery',async()=>{
  execFileSync(path.join(redisDir,'redis-cli.exe'),['-h','127.0.0.1','-p','6386','SHUTDOWN','NOSAVE'],{windowsHide:true,stdio:'pipe'});redisStopped=true;
  const id=randomUUID();await add(id,'SMS');await pause(1200);assert.equal((await psql('SELECT status FROM "Notification" WHERE id=$1',[id])).rows[0].status,'PENDING');
  restartRedis();await until(async()=>{const r=await psql('SELECT status FROM "Notification" WHERE id=$1',[id]);return r.rows[0]?.status==='SENT';});
 });
 await stopWorker();stopWorker=undefined;
 await check('Database outage returns 503 and recovery preserves stored records',async()=>{
  const before=(await psql('SELECT count(*)::int n FROM "PatientProfile"')).rows[0].n;
  pgAction('stop');pgStopped=true;
  const ready=await fetch('http://127.0.0.1:4010/ready');assert.equal(ready.status,503);
  const response=await fetch('http://127.0.0.1:4010/api/v1/departments');assert.equal(response.status,503);assert.equal((await response.json()).error.code,'DATABASE_UNAVAILABLE');
  pgAction('start');pgStopped=false;await until(async()=>{const r=await fetch('http://127.0.0.1:4010/ready');return r.status===200;});assert.equal((await psql('SELECT count(*)::int n FROM "PatientProfile"')).rows[0].n,before);
 });
})().catch(e=>{results.push({name:'Simulation setup',status:'failed',message:e.message});}).finally(async()=>{
 if(redisStopped)restartRedis();if(pgStopped)pgAction('start');await stopWorker?.();await pool.end();
 fs.writeFileSync(path.join(root,'docs/evidence/outage-results.json'),JSON.stringify({simulated:true,timestamp:new Date().toISOString(),results,total:results.length,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length},null,2));if(results.some(r=>r.status==='failed'))process.exitCode=1;
});

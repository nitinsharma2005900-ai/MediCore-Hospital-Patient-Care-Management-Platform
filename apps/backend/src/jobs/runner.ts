import { startWorker } from './notifications';
import { pool } from '../database/postgres';
const stop = startWorker();
const shutdown = async () => { await stop(); await pool.end(); process.exit(0); };
process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);

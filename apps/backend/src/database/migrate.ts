import fs from 'node:fs';
import path from 'node:path';
import { pool } from './postgres';

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(763420)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const root = path.resolve(__dirname, '../../../../database/migrations');
    for (const name of fs.readdirSync(root).sort()) {
      const file = path.join(root, name, 'migration.sql');
      if (!fs.existsSync(file)) continue;
      if ((await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name])).rowCount) continue;
      await client.query(fs.readFileSync(file, 'utf8'));
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
      console.log(JSON.stringify({ event: 'migration_applied', name }));
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
if (require.main === module) migrate().then(() => pool.end()).catch(() => { console.error('Migration failed'); process.exit(1); });

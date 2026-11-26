// One-time, opt-in provisioning of an isolated logical database on existing Render Postgres.
// Remove DATABASE_BOOTSTRAP_URL and this start-command prefix after the first healthy deploy.
// This script never changes existing application databases, roles, or network allow lists.
const { Client } = require('pg');
const identifier = value => '"' + value.replace(/"/g, '""') + '"';
const literal = value => "'" + value.replace(/'/g, "''") + "'";

async function provision() {
  if (!process.env.DATABASE_BOOTSTRAP_URL) throw new Error('BOOTSTRAP_NOT_ENABLED');
  const adminUrl = new URL(process.env.DATABASE_BOOTSTRAP_URL);
  const appUrl = new URL(process.env.DATABASE_URL);
  const database = decodeURIComponent(appUrl.pathname.slice(1));
  const role = decodeURIComponent(appUrl.username);
  const password = decodeURIComponent(appUrl.password);
  if (adminUrl.hostname !== appUrl.hostname || adminUrl.port !== appUrl.port ||
      !/^medicore_[a-z0-9_]+$/.test(database) || !/^medicore_[a-z0-9_]+$/.test(role) ||
      database === adminUrl.pathname.slice(1) || role === decodeURIComponent(adminUrl.username) || password.length < 32) {
    throw new Error('UNSAFE_BOOTSTRAP_CONFIGURATION');
  }
  const admin = new Client({ connectionString: adminUrl.href, connectionTimeoutMillis: 10000 });
  await admin.connect();
  try {
    const existing = await admin.query('SELECT pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname=$1', [database]);
    const roles = await admin.query('SELECT rolcreatedb, rolcreaterole, rolsuper, rolbypassrls FROM pg_roles WHERE rolname=$1', [role]);
    if (existing.rowCount && existing.rows[0].owner !== role) throw new Error('EXISTING_DATABASE_OWNER_MISMATCH');
    if (roles.rowCount && Object.values(roles.rows[0]).some(Boolean)) throw new Error('EXISTING_ROLE_TOO_PRIVILEGED');
    if (!roles.rowCount) {
      await admin.query(`CREATE ROLE ${identifier(role)} LOGIN PASSWORD ${literal(password)} NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`);
    }
    if (!existing.rowCount) {
      await admin.query(`CREATE DATABASE ${identifier(database)} OWNER ${identifier(role)}`);
    }
  } finally { await admin.end(); }
  // Revoke public access only on the newly created MediCore database.
  const app = new Client({ connectionString: appUrl.href, connectionTimeoutMillis: 10000 });
  await app.connect();
  try {
    await app.query(`REVOKE ALL ON DATABASE ${identifier(database)} FROM PUBLIC`);
    await app.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    await app.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
    const result = await app.query('SELECT current_database() AS database, current_user AS role');
    console.log(JSON.stringify({ event: 'medicore_database_provisioned', ...result.rows[0], isolated: true }));
  } finally { await app.end(); }
}

if (require.main === module) provision().catch(error => {
  console.error(JSON.stringify({ event: 'database_provisioning_failed', code: error.code || (/^[A-Z_]+$/.test(error.message) ? error.message : error.name) }));
  process.exitCode = 1;
});
module.exports = { provision };

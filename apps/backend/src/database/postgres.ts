import { Pool, PoolClient, types } from 'pg';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { MediCoreStore, storeContext } from './store';
import { AppError } from '../middlewares/error.middleware';

types.setTypeParser(1700, Number);
types.setTypeParser(1114, value => new Date(value + 'Z'));
export const pool = new Pool({ connectionString: config.database.url, max: 10,
  connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000 });
pool.on('error', () => console.error(JSON.stringify({ event: 'database_connection_error' })));

// Fixed names only: identifiers never originate from HTTP input. Order follows foreign keys.
export const tables = {
  users: 'User', departments: 'Department', doctors: 'DoctorProfile',
  availabilities: 'DoctorAvailability', patients: 'PatientProfile',
  careAssignments: 'CareAssignment',
  appointments: 'Appointment', waitingList: 'WaitingList', encounters: 'Encounter',
  vitalSigns: 'VitalSigns', diagnoses: 'Diagnosis', prescriptions: 'Prescription',
  prescriptionItems: 'PrescriptionItem', labOrders: 'LabOrder', labResults: 'LabResult',
  invoices: 'Invoice', invoiceItems: 'InvoiceItem', payments: 'Payment',
  consents: 'ConsentRecord', refreshTokens: 'RefreshToken', auditLogs: 'AuditLog',
  notifications: 'Notification'
} as const;
type Key = keyof typeof tables;
const keys = Object.keys(tables) as Key[];
const cloneState = (state: MediCoreStore) => Object.fromEntries(keys.map(key => [key, structuredClone(state[key])])) as unknown as MediCoreStore;
const quote = (name: string) => '"' + name.replace(/"/g, '""') + '"';

async function load(client: PoolClient) {
  const state = new MediCoreStore();
  for (const key of keys) (state[key] as any) = (await client.query(`SELECT * FROM ${quote(tables[key])}`)).rows;
  return state;
}

async function flush(client: PoolClient, state: MediCoreStore, original: MediCoreStore) {
  for (const key of [...keys].reverse()) {
    const currentIds = new Set(state[key].map((r: any) => r.id));
    for (const row of original[key]) if (!currentIds.has(row.id)) {
      if (key === 'auditLogs') throw new Error('Audit history is append-only');
      await client.query(`DELETE FROM ${quote(tables[key])} WHERE id = $1`, [row.id]);
    }
  }
  for (const key of keys) {
    const before = new Map(original[key].map((r: any) => [r.id, JSON.stringify(r)]));
    for (const row of state[key] as any[]) {
      if (before.get(row.id) === JSON.stringify(row)) continue;
      if (key === 'auditLogs' && before.has(row.id)) throw new Error('Audit history is immutable');
      const columns = Object.keys(row).filter(c => row[c] !== undefined);
      const updates = columns.filter(c => c !== 'id').map(c => `${quote(c)} = EXCLUDED.${quote(c)}`).join(', ');
      await client.query(`INSERT INTO ${quote(tables[key])} (${columns.map(quote).join(', ')})
        VALUES (${columns.map((_, i) => '$' + (i + 1)).join(', ')})
        ON CONFLICT (id) DO UPDATE SET ${updates}`, columns.map(c => row[c]));
    }
  }
}

export async function withDatabase<T>(action: () => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // The compatibility unit of work serializes writers across API and worker processes.
    // The independent GiST exclusion constraint also protects SQL clients outside this lock.
    await client.query("SET LOCAL lock_timeout = '8s'");
    await client.query('SELECT pg_advisory_xact_lock(763421)');
    const state = await load(client);
    const original = cloneState(state);
    const result = await storeContext.run(state, action);
    await flush(client, state, original);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally { client.release(); }
}

export function databaseRequest(req: Request, res: Response, next: NextFunction) {
  if (config.database.mode === 'memory' && config.env === 'test') return next();
  const send = res.json.bind(res);
  let payload: any;
  let responseStatus = 200;
  withDatabase(async () => {
    const state = storeContext.getStore()!;
    const original = cloneState(state);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new AppError('Request timed out', 503, 'REQUEST_TIMEOUT')), 15000);
      res.json = ((body: any) => {
        if (Array.isArray(body.data) && !body.meta?.page && !req.path.endsWith('/available-slots')) {
          const page=Number(req.query.page||1),limit=Number(req.query.limit||100),total=body.data.length;
          body.data=body.data.slice((page-1)*limit,page*limit);
          body.meta={...body.meta,page,limit,total,totalPages:Math.ceil(total/limit)};
        }
        clearTimeout(timeout); payload = body; responseStatus = res.statusCode; resolve(); return res;
      }) as Response['json'];
      next();
    });
    // Failed operations cannot persist partial clinical/billing changes. Preserve security evidence.
    if (responseStatus >= 400) for (const key of keys) {
      if (!['users', 'refreshTokens', 'auditLogs'].includes(key)) (state[key] as any) = original[key];
    }
  }).then(() => {
    res.json = send; res.status(responseStatus); send(payload);
  }).catch((error: any) => {
    res.json = send;
    if (error.code === '23P01') return next(new AppError('Doctor already has an overlapping appointment', 409, 'APPOINTMENT_CONFLICT'));
    if (error.code === '23505') return next(new AppError('A unique record already exists', 409, 'DUPLICATE_RECORD'));
    if (error.code === '23503' || error.code === '23514') return next(new AppError('Related records or values are inconsistent', 400, 'DATA_INTEGRITY_ERROR'));
    next(error instanceof AppError ? error : new AppError('Database unavailable; please retry later', 503, 'DATABASE_UNAVAILABLE'));
  });
}

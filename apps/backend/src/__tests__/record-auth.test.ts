import request from 'supertest';
import { createApp } from '../app';
import { seedDatabase } from '../database/seed';
import { store } from '../database/store';

describe('Assessment 04 & 12 - Clinical Record-Level Authorization & Privacy', () => {
  const app = createApp();
  let patientToken: string;
  let patientId: string;
  let otherPatientId: string;

  beforeAll(async () => {
    await seedDatabase();

    const patLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'patient@medicore.health',
      password: 'Password123!'
    });
    patientToken = patLogin.body.data.tokens.accessToken;
    patientId = patLogin.body.data.user.patientProfileId;

    // Pick a different patient
    const other = store.patients.find(p => p.id !== patientId)!;
    otherPatientId = other.id;
  });

  it('should allow patient to view their own profile chart', async () => {
    const res = await request(app)
      .get(`/api/v1/patients/${patientId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(patientId);
  });

  it('should prevent IDOR: reject patient attempt to access another patient chart with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/v1/patients/${otherPatientId}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should prevent patient from viewing another patient invoices', async () => {
    // Find an invoice belonging to otherPatientId
    const otherInvoice = store.invoices.find(i => i.patientId === otherPatientId);
    if (otherInvoice) {
      const res = await request(app)
        .get(`/api/v1/billing/invoices/${otherInvoice.id}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    }
  });

  it('should allow patient to update their consent settings and log an audit record', async () => {
    const res = await request(app)
      .post(`/api/v1/consent/patient/${patientId}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        consentType: 'RESEARCH',
        granted: false,
        revocationReason: 'Patient opting out of non-therapeutic research trials'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.granted).toBe(false);
    expect(res.body.data.revocationReason).toBe('Patient opting out of non-therapeutic research trials');

    // Verify audit log exists
    const auditRecord = store.auditLogs.find(
      l => l.action === 'UPDATE_CONSENT' && l.details?.includes('RESEARCH')
    );
    expect(auditRecord).toBeDefined();
  });
});

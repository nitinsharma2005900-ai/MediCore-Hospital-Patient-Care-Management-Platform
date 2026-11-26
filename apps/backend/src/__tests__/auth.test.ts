import request from 'supertest';
import { createApp } from '../app';
import { seedDatabase } from '../database/seed';

describe('Assessment 04 - Authentication and Access Control', () => {
  const app = createApp();

  beforeAll(async () => {
    await seedDatabase();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate valid credentials and return JWT tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doctor@medicore.health',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.user.role).toBe('DOCTOR');
    });

    it('should reject invalid credentials with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'doctor@medicore.health',
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject invalid email format with validation error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should prevent non-admin users from accessing system audit logs', async () => {
      // Login as patient
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'patient@medicore.health',
          password: 'Password123!'
        });

      const patientToken = loginRes.body.data.tokens.accessToken;

      const auditRes = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(auditRes.status).toBe(403);
      expect(auditRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should permit administrator to view system audit logs', async () => {
      const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@medicore.health',
          password: 'Password123!'
        });

      const adminToken = adminLogin.body.data.tokens.accessToken;

      const auditRes = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body.success).toBe(true);
      expect(Array.isArray(auditRes.body.data)).toBe(true);
    });
  });
});

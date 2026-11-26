import request from 'supertest';
import { createApp } from '../app';
import { seedDatabase } from '../database/seed';
import { store } from '../database/store';

describe('Assessment 07 & 12 - Appointment Concurrency and Conflict Prevention', () => {
  const app = createApp();
  let doctorToken: string;
  let patientToken: string;
  let testDoctorId: string;
  let testDeptId: string;

  beforeAll(async () => {
    await seedDatabase();

    // Login doctor & patient
    const docLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'doctor@medicore.health',
      password: 'Password123!'
    });
    doctorToken = docLogin.body.data.tokens.accessToken;
    testDoctorId = docLogin.body.data.user.doctorProfileId;

    const patLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'patient@medicore.health',
      password: 'Password123!'
    });
    patientToken = patLogin.body.data.tokens.accessToken;

    testDeptId = store.departments[0].id;
  });

  it('should reject simultaneous booking requests for the exact same doctor and time slot', async () => {
    const slotTime = '2026-12-05T14:00:00.000Z';
    const slotEndTime = '2026-12-05T14:30:00.000Z';

    const patientA = store.patients[0].id;
    const patientB = store.patients[1].id;

    // Dispatch two concurrent booking requests simultaneously
    const req1 = request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientA,
        doctorId: testDoctorId,
        departmentId: testDeptId,
        scheduledStartTime: slotTime,
        scheduledEndTime: slotEndTime,
        type: 'ROUTINE',
        reason: 'Patient A consultation',
        priority: 'NORMAL'
      });

    const req2 = request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: patientB,
        doctorId: testDoctorId,
        departmentId: testDeptId,
        scheduledStartTime: slotTime,
        scheduledEndTime: slotEndTime,
        type: 'ROUTINE',
        reason: 'Patient B consultation',
        priority: 'NORMAL'
      });

    const [res1, res2] = await Promise.all([req1, req2]);

    // One must succeed (201) and one must be rejected with Conflict (409)
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const conflictRes = res1.status === 409 ? res1 : res2;
    expect(conflictRes.body.success).toBe(false);
    expect(conflictRes.body.error.code).toBe('APPOINTMENT_CONFLICT');
  });

  it('should reject booking when time ranges partially overlap existing appointment', async () => {
    // Existing appointment is 14:00 - 14:30
    // Try booking 14:15 - 14:45
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: store.patients[2].id,
        doctorId: testDoctorId,
        departmentId: testDeptId,
        scheduledStartTime: '2026-12-05T14:15:00.000Z',
        scheduledEndTime: '2026-12-05T14:45:00.000Z',
        type: 'ROUTINE',
        reason: 'Overlapping consult',
        priority: 'NORMAL'
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('APPOINTMENT_CONFLICT');
  });

  it('should allow booking for an adjacent, non-overlapping slot', async () => {
    // Try booking 14:30 - 15:00
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId: store.patients[3].id,
        doctorId: testDoctorId,
        departmentId: testDeptId,
        scheduledStartTime: '2026-12-05T14:30:00.000Z',
        scheduledEndTime: '2026-12-05T15:00:00.000Z',
        type: 'ROUTINE',
        reason: 'Adjacent consult',
        priority: 'NORMAL'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

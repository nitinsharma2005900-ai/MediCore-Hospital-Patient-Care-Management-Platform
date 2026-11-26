import request from 'supertest';
import { createApp } from '../app';
import { seedDatabase } from '../database/seed';
import { store } from '../database/store';

describe('Assessment 02, 07 & 12 - Complete Clinical Care Workflow', () => {
  const app = createApp();

  let patientToken: string;
  let patientId: string;
  let doctorToken: string;
  let doctorId: string;
  let receptionistToken: string;
  let nurseToken: string;
  let labTechToken: string;
  let billingToken: string;

  let appointmentId: string;
  let encounterId: string;
  let labOrderId: string;
  let labResultId: string;
  let invoiceId: string;

  beforeAll(async () => {
    await seedDatabase();

    // Authenticate all personas
    const pLog = await request(app).post('/api/v1/auth/login').send({ email: 'patient@medicore.health', password: 'Password123!' });
    patientToken = pLog.body.data.tokens.accessToken;
    patientId = pLog.body.data.user.patientProfileId;

    const dLog = await request(app).post('/api/v1/auth/login').send({ email: 'doctor@medicore.health', password: 'Password123!' });
    doctorToken = dLog.body.data.tokens.accessToken;
    doctorId = dLog.body.data.user.doctorProfileId;

    const rLog = await request(app).post('/api/v1/auth/login').send({ email: 'receptionist@medicore.health', password: 'Password123!' });
    receptionistToken = rLog.body.data.tokens.accessToken;

    const nLog = await request(app).post('/api/v1/auth/login').send({ email: 'nurse@medicore.health', password: 'Password123!' });
    nurseToken = nLog.body.data.tokens.accessToken;

    const lLog = await request(app).post('/api/v1/auth/login').send({ email: 'labtech@medicore.health', password: 'Password123!' });
    labTechToken = lLog.body.data.tokens.accessToken;

    const bLog = await request(app).post('/api/v1/auth/login').send({ email: 'billing@medicore.health', password: 'Password123!' });
    billingToken = bLog.body.data.tokens.accessToken;
  });

  // Step 1: Patient books appointment
  it('Step 1: Patient books appointment with specialist', async () => {
    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        departmentId: store.departments[0].id,
        scheduledStartTime: '2026-12-10T09:00:00.000Z',
        scheduledEndTime: '2026-12-10T09:30:00.000Z',
        type: 'ROUTINE',
        reason: 'Recurrent morning headaches and blurred vision',
        priority: 'NORMAL'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
    appointmentId = res.body.data.id;
  });

  // Step 2: Receptionist checks in patient
  it('Step 2: Receptionist marks patient as arrived / checked in', async () => {
    const res = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/check-in`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CHECKED_IN');
    expect(res.body.data.checkedInAt).toBeDefined();
  });

  // Step 3: Doctor starts clinical encounter
  it('Step 3: Attending Doctor starts clinical encounter', async () => {
    const res = await request(app)
      .post('/api/v1/encounters')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId,
        patientId,
        chiefComplaint: 'Recurrent morning headaches and blurred vision',
        clinicalNotes: 'Patient present for consultation. Normotensive on arrival.',
        type: 'OUTPATIENT'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('IN_PROGRESS');
    encounterId = res.body.data.id;
  });

  // Step 4: Nurse records vitals
  it('Step 4: Clinical Nurse records patient vital signs', async () => {
    const res = await request(app)
      .post('/api/v1/encounters/vitals')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        encounterId,
        patientId,
        systolicBp: 122,
        diastolicBp: 80,
        heartRate: 72,
        respiratoryRate: 16,
        temperature: 36.6,
        oxygenSaturation: 99,
        heightCm: 175,
        weightKg: 78,
        notes: 'Vitals stable'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.bmi).toBe(25.5);
  });

  // Step 5: Doctor adds ICD-10 diagnosis
  it('Step 5: Doctor records confirmed ICD-10 diagnosis', async () => {
    const res = await request(app)
      .post('/api/v1/encounters/diagnoses')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        encounterId,
        patientId,
        icdCode: 'G43.909',
        icdDescription: 'Migraine, unspecified, not intractable',
        type: 'PRIMARY',
        confidence: 'CONFIRMED'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.icdCode).toBe('G43.909');
  });

  // Step 6: Doctor issues electronic prescription
  it('Step 6: Doctor prescribes pharmacological therapy', async () => {
    const res = await request(app)
      .post('/api/v1/prescriptions')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        encounterId,
        patientId,
        instructions: 'Take sumatriptan at first onset of migraine attack.',
        items: [
          {
            medicationName: 'Sumatriptan Succinate',
            dosage: '50mg',
            route: 'Oral',
            frequency: 'At onset of headache; may repeat in 2 hours if needed',
            durationDays: 30,
            quantity: 9,
            refillsAllowed: 1
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.prescription.status).toBe('ACTIVE');
    expect(res.body.data.items.length).toBe(1);
  });

  // Step 7: Doctor orders lab test
  it('Step 7: Doctor orders diagnostic laboratory test panel', async () => {
    const res = await request(app)
      .post('/api/v1/lab/orders')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        encounterId,
        patientId,
        testPanelName: 'Comprehensive Metabolic Panel (CMP)',
        priority: 'ROUTINE',
        clinicalIndication: 'Rule out metabolic etiologies of cephalalgia'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    labOrderId = res.body.data.id;
  });

  // Step 8: Lab technician enters test result
  it('Step 8: Lab Technician logs measured specimen result', async () => {
    const res = await request(app)
      .post('/api/v1/lab/results')
      .set('Authorization', `Bearer ${labTechToken}`)
      .send({
        labOrderId,
        patientId,
        testName: 'Serum Creatinine',
        testCode: '2160-0',
        measuredValue: '0.88',
        unit: 'mg/dL',
        referenceRangeLow: '0.60',
        referenceRangeHigh: '1.20',
        interpretation: 'NORMAL',
        specimenType: 'Blood - Serum'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.interpretation).toBe('NORMAL');
    labResultId = res.body.data.id;
  });

  // Step 9: Doctor validates lab result to FINAL
  it('Step 9: Doctor validates preliminary lab result to FINAL', async () => {
    const res = await request(app)
      .patch(`/api/v1/lab/results/${labResultId}/validate`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('FINAL');
    expect(res.body.data.validatedAt).toBeDefined();
  });

  // Step 10: Doctor completes encounter
  it('Step 10: Doctor concludes and completes clinical encounter', async () => {
    const res = await request(app)
      .patch(`/api/v1/encounters/${encounterId}/complete`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ clinicalNotes: 'Migraine management plan reviewed with patient. Prescription dispensed.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  // Step 11: Billing officer generates invoice
  it('Step 11: Billing Officer generates itemized invoice', async () => {
    const res = await request(app)
      .post('/api/v1/billing/invoices')
      .set('Authorization', `Bearer ${billingToken}`)
      .send({
        patientId,
        encounterId,
        items: [
          { description: 'Specialist Consultation - Cardiology', category: 'CONSULTATION', quantity: 1, unitPrice: 180.00 },
          { description: 'Comprehensive Metabolic Panel', category: 'LAB_TEST', quantity: 1, unitPrice: 75.00 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.invoice.totalAmount).toBe(255.00);
    expect(res.body.data.invoice.balanceAmount).toBe(255.00);
    invoiceId = res.body.data.invoice.id;
  });

  // Step 12: Payment is settled
  it('Step 12: Process simulated payment settling balance in full', async () => {
    const res = await request(app)
      .post('/api/v1/billing/payments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        invoiceId,
        amount: 255.00,
        paymentMethod: 'SIMULATED'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.invoice.status).toBe('PAID');
    expect(res.body.data.invoice.balanceAmount).toBe(0);
  });
});

// Synthetic release smoke/workflow checks. Never run outage fixtures against cloud resources.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const frontend = process.env.LIVE_FRONTEND_URL;
const backend = process.env.LIVE_BACKEND_URL;
const analytics = process.env.LIVE_ANALYTICS_URL;
if (![frontend, backend, analytics].every(url => url?.startsWith('https://'))) throw new Error('Set all three LIVE_*_URL variables to verified HTTPS origins');
const results = [], sessions = {};
let patientId, otherPatientId, doctorId, departmentId, appointment, encounter, labOrder, labResult, invoice;
async function call(url, method = 'GET', body, token, headers = {}) {
  const response = await fetch(url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(120000) });
  let json; try { json = await response.json(); } catch { json = {}; }
  return { status: response.status, body: json, headers: response.headers };
}
const api = (role, method, path, body) => call(frontend + '/api/v1' + path, method, body, role && sessions[role]?.tokens.accessToken);
async function check(name, fn, required = false) {
  const start = Date.now();
  try { await fn(); results.push({ name, status: 'passed', ms: Date.now() - start }); console.log('PASS ' + name); }
  catch (error) {
    results.push({ name, status: 'failed', ms: Date.now() - start, message: error.message.slice(0, 300) }); console.log('FAIL ' + name + ': ' + error.message.slice(0, 160));
    if (required) throw new Error('Required prerequisite failed: ' + name);
  }
}
function expected(response, status) { assert.equal(response.status, status, `Expected HTTP ${status}, received ${response.status}`); return response.body.data; }
async function main() {
  await check('Public frontend and both service health endpoints use HTTPS', async () => {
    assert.equal((await fetch(frontend + '/login', { signal: AbortSignal.timeout(120000) })).status, 200);
    const ready = await call(backend + '/ready'); expected(ready, 200); assert.equal(ready.body.checks.mode, 'postgres');
    expected(await call(analytics + '/health'), 200);
  }, true);
  await check('Both public API documentation pages are available', async () => {
    assert.equal((await fetch(backend + '/api-docs/', { signal: AbortSignal.timeout(120000) })).status, 200);
    assert.equal((await fetch(analytics + '/docs', { signal: AbortSignal.timeout(120000) })).status, 200);
  });
  await check('Production CORS allows the website and rejects unrelated origins', async () => {
    const allowed = await call(backend + '/ready', 'GET', undefined, undefined, { Origin: frontend });
    assert.equal(allowed.headers.get('access-control-allow-origin'), frontend);
    const denied = await call(backend + '/ready', 'GET', undefined, undefined, { Origin: 'https://unrelated.example.test' });
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
  });
  await check('Unauthenticated clinical request and invalid login are rejected', async () => {
    expected(await api(null, 'GET', '/patients'), 401);
    expected(await api(null, 'POST', '/auth/login', { email: 'patient@medicore.health', password: 'InvalidSyntheticPassword!' }), 401);
  });
  await check('Public registration persists a patient and ignores requested administrator role', async () => {
    const data = expected(await api(null, 'POST', '/auth/register', { email: `synthetic.live.${randomUUID()}@example.test`, password: 'Password123!', firstName: 'Cloud', lastName: 'Synthetic', phone: '+1-555-0199', dateOfBirth: '1990-01-01', gender: 'FEMALE', emergencyContactName: 'Synthetic Guardian', emergencyContactPhone: '+1-555-0101', address: 'Synthetic cloud assessment fixture address', role: 'ADMIN' }), 201);
    assert.equal(data.user.role, 'PATIENT'); otherPatientId = data.user.patientProfileId;
    assert(otherPatientId);
  }, true);
  for (const role of ['patient', 'doctor', 'receptionist', 'nurse', 'labtech', 'billing', 'admin']) {
    await check('Authenticate persisted ' + role + ' through the website proxy', async () => {
      sessions[role] = expected(await api(null, 'POST', '/auth/login', { email: role + '@medicore.health', password: 'Password123!' }), 200);
      assert(sessions[role].tokens.accessToken);
    }, true);
  }
  patientId = sessions.patient.user.patientProfileId; doctorId = sessions.doctor.user.doctorProfileId;
  for (const [role, path] of [['patient', '/patients/' + patientId], ['doctor', '/patients/' + patientId], ['nurse', '/patients/' + patientId], ['receptionist', '/appointments'], ['labtech', '/lab/orders'], ['billing', '/billing/invoices'], ['admin', '/audit']]) {
    await check(role + ' permitted role operation succeeds', async () => { expected(await api(role, 'GET', path), 200); });
  }
  for (const role of ['patient', 'doctor', 'nurse', 'receptionist', 'labtech', 'billing']) {
    await check(role + ' cannot access administrator staff management', async () => { expected(await api(role, 'GET', '/operations/staff'), 403); });
  }
  for (const role of ['admin', 'receptionist', 'billing', 'labtech']) {
    await check(role + ' cannot read full clinical charts', async () => { expected(await api(role, 'GET', '/patients/' + patientId), 403); });
  }
  await check('Patient cross-patient record access is rejected', async () => { expected(await api('patient', 'GET', '/patients/' + otherPatientId), 403); });
  const doctor = expected(await api(null, 'GET', '/doctors/' + doctorId), 200); departmentId = doctor.departmentId;
  let slots;
  await check('Provider availability returns real future slots', async () => {
    for (let day = 20; day < 28; day++) {
      const date = new Date(Date.now() + day * 86400000).toISOString().slice(0, 10);
      slots = expected(await api(null, 'GET', `/doctors/${doctorId}/available-slots?date=${date}`), 200);
      if (slots.length >= 3) break;
    }
    assert(slots.length >= 3);
  }, true);
  const booking = { doctorId, departmentId, scheduledStartTime: slots[0].startTime, scheduledEndTime: slots[0].endTime, type: 'ROUTINE', reason: 'Synthetic Render workflow verification', priority: 'NORMAL' };
  await check('Simultaneous public booking requests produce one success and one conflict', async () => {
    const responses = await Promise.all([api('patient', 'POST', '/appointments', booking), api('patient', 'POST', '/appointments', booking)]);
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]); appointment = responses.find(r => r.status === 201).body.data;
  }, true);
  await check('Patient reschedules and cancels a separate appointment', async () => {
    const second = expected(await api('patient', 'POST', '/appointments', { ...booking, scheduledStartTime: slots[1].startTime, scheduledEndTime: slots[1].endTime }), 201);
    expected(await api('patient', 'PATCH', `/appointments/${second.id}/reschedule`, { newStartTime: slots[2].startTime, newEndTime: slots[2].endTime, reason: 'Synthetic release check' }), 200);
    assert.equal(expected(await api('patient', 'PATCH', `/appointments/${second.id}/cancel`, { cancellationReason: 'Synthetic release check completed' }), 200).status, 'CANCELLED');
  });
  await check('Receptionist checks in the booked appointment', async () => { assert.equal(expected(await api('receptionist', 'PATCH', `/appointments/${appointment.id}/check-in`, {}), 200).status, 'CHECKED_IN'); }, true);
  await check('Assigned doctor creates the patient encounter', async () => { encounter = expected(await api('doctor', 'POST', '/encounters', { appointmentId: appointment.id, patientId, chiefComplaint: 'Synthetic cloud workflow', type: 'OUTPATIENT' }), 201); }, true);
  await check('Assigned nurse records synthetic vitals', async () => { expected(await api('nurse', 'POST', '/encounters/vitals', { encounterId: encounter.id, patientId, systolicBp: 120, diastolicBp: 80, heartRate: 72 }), 201); });
  await check('Doctor records a clinician-entered synthetic diagnosis', async () => { expected(await api('doctor', 'POST', '/encounters/diagnoses', { encounterId: encounter.id, patientId, icdCode: 'Z00.00', icdDescription: 'Synthetic release fixture', type: 'PRIMARY', confidence: 'CONFIRMED' }), 201); });
  await check('Invalid prescriptions are rejected', async () => { expected(await api('doctor', 'POST', '/prescriptions', { encounterId: encounter.id, patientId, items: [{ medicationName: 'Synthetic item', dosage: '', route: 'Oral', frequency: 'Fixture', durationDays: 0, quantity: -1 }] }), 400); });
  await check('Valid clinician-entered prescription persists', async () => { expected(await api('doctor', 'POST', '/prescriptions', { encounterId: encounter.id, patientId, instructions: 'Synthetic fixture only', items: [{ medicationName: 'Synthetic medication fixture', dosage: '1 unit', route: 'Oral', frequency: 'Fixture entry', durationDays: 1, quantity: 1, refillsAllowed: 0 }] }), 201); });
  await check('Doctor orders an assigned laboratory test', async () => { labOrder = expected(await api('doctor', 'POST', '/lab/orders', { encounterId: encounter.id, patientId, testPanelName: 'Synthetic glucose panel', priority: 'ROUTINE' }), 201); }, true);
  const result = { labOrderId: labOrder.id, patientId, testName: 'Synthetic Glucose', testCode: '1558-6', measuredValue: '95', unit: 'mg/dL', referenceRangeLow: '70', referenceRangeHigh: '100', interpretation: 'NORMAL', specimenType: 'Synthetic serum' };
  await check('Incorrect patient/result association is rejected', async () => { expected(await api('labtech', 'POST', '/lab/results', { ...result, patientId: otherPatientId }), 400); });
  await check('Missing laboratory result fields are rejected', async () => { expected(await api('labtech', 'POST', '/lab/results', { labOrderId: labOrder.id, patientId }), 400); });
  await check('Assigned technician enters a preliminary result', async () => { labResult = expected(await api('labtech', 'POST', '/lab/results', result), 201); }, true);
  await check('Patient cannot see preliminary laboratory data', async () => { assert.equal(expected(await api('patient', 'GET', '/lab/orders/' + labOrder.id), 200).results.length, 0); });
  await check('Ordering doctor validates the result before patient release', async () => {
    expected(await api('doctor', 'PATCH', `/lab/results/${labResult.id}/validate`, {}), 200);
    assert.equal(expected(await api('patient', 'GET', '/lab/orders/' + labOrder.id), 200).results[0].status, 'FINAL');
  });
  await check('Consent revocation blocks the doctor immediately and can be restored', async () => {
    expected(await api('patient', 'POST', `/consent/patient/${patientId}`, { consentType: 'CLINICAL_DATA_SHARING', granted: false, revocationReason: 'Synthetic release privacy check' }), 200);
    try { expected(await api('doctor', 'GET', '/encounters/' + encounter.id), 403); }
    finally { expected(await api('patient', 'POST', `/consent/patient/${patientId}`, { consentType: 'CLINICAL_DATA_SHARING', granted: true }), 200); }
  });
  await check('Doctor completes the encounter', async () => { expected(await api('doctor', 'PATCH', `/encounters/${encounter.id}/complete`, { clinicalNotes: 'Synthetic cloud workflow completed' }), 200); });
  await check('Billing creates an itemized invoice', async () => { invoice = expected(await api('billing', 'POST', '/billing/invoices', { patientId, encounterId: encounter.id, items: [{ description: 'Synthetic consultation', category: 'CONSULTATION', quantity: 1, unitPrice: 120.25 }] }), 201).invoice; assert.equal(invoice.totalAmount, 120.25); }, true);
  await check('Simulated payment settles the invoice', async () => { assert.equal(expected(await api('patient', 'POST', '/billing/payments', { invoiceId: invoice.id, amount: 120.25, paymentMethod: 'SIMULATED', transactionReference: 'CLOUD-' + randomUUID() }), 200).invoice.balanceAmount, 0); });
  await check('Redis worker delivers queued EMAIL and SMS simulators', async () => {
    let notifications = [];
    for (let attempt = 0; attempt < 12; attempt++) {
      notifications = expected(await api('patient', 'GET', '/notifications'), 200).notifications;
      if (['EMAIL', 'SMS'].every(channel => notifications.some(n => n.channel === channel && n.status === 'SENT' && n.createdAt >= appointment.createdAt))) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    for (const channel of ['EMAIL', 'SMS']) assert(notifications.some(n => n.channel === channel && n.status === 'SENT' && n.createdAt >= appointment.createdAt), 'Delivered ' + channel + ' simulator required');
  });
  for (const type of ['Patient', 'Appointment', 'Encounter', 'Observation']) await check('Authenticated scoped FHIR mock ' + type + ' export succeeds', async () => { const response = await api('patient', 'GET', '/fhir/' + type); assert.equal(response.status, 200); assert.equal(response.body.resourceType, 'Bundle'); });
  await check('FastAPI public analytics matches authoritative PostgreSQL-backed API counts', async () => {
    const source = expected(await api('admin', 'GET', '/operations/analytics-source'), 200);
    const response = await call(analytics + '/analytics/appointment-utilization', 'GET', undefined, sessions.admin.tokens.accessToken);
    assert.equal(response.status, 200); assert.equal(response.body.data.total_appointments, source.appointments.length);
    const proxy = await call(frontend + '/analytics/population-metrics', 'GET', undefined, sessions.admin.tokens.accessToken); assert.equal(proxy.status, 200);
    assert.equal((await call(analytics + '/analytics/appointment-utilization', 'GET', undefined, sessions.patient.tokens.accessToken)).status, 403);
  });
  await check('Administrator audit history includes denied access and workflow changes', async () => {
    const response = await api('admin', 'GET', '/audit?limit=100'); expected(response, 200);
    assert(response.body.data.some(row => row.action === 'ACCESS_DENIED'));
    assert(response.body.meta.total > 0);
  });
  await check('Logout revokes access and a fresh login sees the paid invoice', async () => {
    expected(await api('patient', 'POST', '/auth/logout', {}), 200); expected(await api('patient', 'GET', '/auth/me'), 401);
    sessions.patient = expected(await api(null, 'POST', '/auth/login', { email: 'patient@medicore.health', password: 'Password123!' }), 200);
    assert.equal(expected(await api('patient', 'GET', '/billing/invoices/' + invoice.id), 200).status, 'PAID');
  });
}
main().catch(error => console.error(error.message)).finally(() => {
  const report = { recordedAt: new Date().toISOString(), frontend, backend, analytics, scope: 'Live synthetic cloud checks; no dependency outages or destructive SQL', results, total: results.length, passed: results.filter(r => r.status === 'passed').length, failed: results.filter(r => r.status === 'failed').length, skipped: 0 };
  fs.mkdirSync('docs/evidence', { recursive: true }); fs.writeFileSync('docs/evidence/live-results.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ total: report.total, passed: report.passed, failed: report.failed }));
  if (report.failed || report.total < 50) process.exitCode = 1;
});

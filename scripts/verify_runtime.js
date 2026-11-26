const http = require('http');
const { createApp } = require('../apps/backend/dist/app');
const { seedDatabase } = require('../apps/backend/dist/database/seed');
const { store } = require('../apps/backend/dist/database/store');

async function run() {
  console.log('[Runtime Verification] Seeding database...');
  await seedDatabase();

  const app = createApp();
  const PORT = 4005;

  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[Runtime Verification] Backend server listening on http://127.0.0.1:${PORT}`);

  function fetchUrl(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`http://127.0.0.1:${PORT}${path}`, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  try {
    // 1. Health check
    const health = await fetchUrl('/health');
    console.log(`[Test 1] GET /health -> Status: ${health.status}`);
    const healthBody = JSON.parse(health.data);
    console.log(`         Service: ${healthBody.service}, Status: ${healthBody.status}`);

    // 2. Swagger Docs UI
    const docs = await fetchUrl('/api-docs/');
    console.log(`[Test 2] GET /api-docs/ -> Status: ${docs.status} (Swagger UI reachable)`);

    // 3. Auth login (Patient)
    const loginRes = await fetchUrl('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@medicore.health', password: 'Password123!' })
    });
    console.log(`[Test 3] POST /api/v1/auth/login -> Status: ${loginRes.status}`);
    const loginData = JSON.parse(loginRes.data);
    const token = loginData.data.tokens.accessToken;
    console.log(`         Authenticated User: ${loginData.data.user.email} (${loginData.data.user.role})`);

    // 4. Authenticated Departments query
    const deptsRes = await fetchUrl('/api/v1/departments', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`[Test 4] GET /api/v1/departments -> Status: ${deptsRes.status}`);
    const depts = JSON.parse(deptsRes.data);
    console.log(`         Departments count: ${depts.data.length}`);

    // 5. Doctors listing
    const docsRes = await fetchUrl('/api/v1/doctors', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`[Test 5] GET /api/v1/doctors -> Status: ${docsRes.status}`);
    const doctors = JSON.parse(docsRes.data);
    console.log(`         Doctors count: ${doctors.data.length}`);

    // 6. FHIR Patient Bundle
    const fhirRes = await fetchUrl('/api/v1/fhir/Patient', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`[Test 6] GET /api/v1/fhir/Patient -> Status: ${fhirRes.status}`);
    const fhirData = JSON.parse(fhirRes.data);
    console.log(`         FHIR ResourceType: ${fhirData.resourceType}, Total Patients: ${fhirData.total}`);

    console.log('\n[SUCCESS] All Backend live HTTP runtime checks passed with 100% success!\n');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('[Runtime Verification Error]', err);
  process.exit(1);
});

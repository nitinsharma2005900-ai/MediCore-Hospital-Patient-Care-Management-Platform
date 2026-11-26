# Incident Simulation 01: Unauthorized Clinical Record Access (IDOR Attempt)
**Assessment 15: Healthcare Incident Simulation**

## 1. Incident Description
On November 24, 2026, security audit monitors detected an anomaly: a logged-in patient (User ID: `usr-patient-001`, Patient Profile: `pat-001`) attempted to query clinical consultation records, diagnoses, and invoices belonging to an unrelated patient (`pat-099`).

## 2. Reproduction Steps
1. Authenticate as Patient A (`patient@medicore.health`).
2. Capture the JWT access token: `Bearer eyJhbGciOiJIUzI1...`.
3. Submit an HTTP GET request to `/api/v1/patients/pat-099` using Patient A's Bearer token.
4. Submit an HTTP GET request to `/api/v1/billing/invoices/inv-099` using Patient A's Bearer token.

## 3. Relevant Log Evidence
```text
[2026-11-24T14:22:01.102Z] WARN [req-id: req-sec-991201]: Cross-patient clinical record access attempt detected.
Operator: usr-patient-001 (Role: PATIENT)
Target Resource: PatientProfile / pat-099
IP: 198.51.100.44
Action: BLOCKED (403 Forbidden - CROSS_PATIENT_ACCESS_FORBIDDEN)
[2026-11-24T14:22:01.108Z] INFO: Security event recorded in AuditLog table (Event ID: aud-sec-4819).
```

## 4. Root Cause Analysis (RCA)
In older legacy implementations, endpoints frequently accepted an ID parameter directly from the route URL and queried the database without cross-referencing whether the authenticated user's ID or profile owned the target entity, exposing an Insecure Direct Object Reference (IDOR) vulnerability.

## 5. Implemented Fix
Added the `requirePatientSelfOrClinicalStaff` middleware and explicit record-level ownership checks inside controllers:
```typescript
if (req.user.role === UserRole.PATIENT) {
  if (!req.user.patientProfileId || req.user.patientProfileId !== targetPatientId) {
    throw new AppError('Access denied: You are only authorized to access your own medical records.', 403, 'CROSS_PATIENT_ACCESS_FORBIDDEN');
  }
}
```

## 6. Regression Test
Automated test case in `apps/backend/src/__tests__/record-auth.test.ts`:
```typescript
it('should prevent IDOR: reject patient attempt to access another patient chart with 403 Forbidden', async () => {
  const res = await request(app)
    .get(`/api/v1/patients/${otherPatientId}`)
    .set('Authorization', `Bearer ${patientToken}`);
  expect(res.status).toBe(403);
});
```

## 7. Prevention Strategy
- Centralized `record-auth.middleware.ts` enforces ownership on all `/patients/:id`, `/prescriptions/:id`, `/invoices/:id`, and `/consent/:id` endpoints.
- Continuous automated security tests in GitHub Actions CI pipeline.
- Immediate automated lockout and security alerting if more than 3 cross-patient IDOR attempts occur within 5 minutes.

## 8. Recovery Evidence
Regression suite executed: test passed with 100% block rate across all simulated patient IDs. Audit log created within 5ms of attempt.

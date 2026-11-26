# Access Control & Clinical Security Review Checklist
**Assessment 10: Git and Clinical Change Review**

Any pull request modifying routing, authentication middleware, permission boundaries, or data endpoints must satisfy this checklist:

## 1. Authentication & Session Validation
- [ ] Endpoint is protected by `authenticate` middleware requiring a valid, unexpired JWT.
- [ ] Session revocation check verified against revoked token hash table.
- [ ] User status checked: disabled or locked accounts are denied.

## 2. Role-Based Access Control (RBAC)
- [ ] Explicit allowed roles declared using `requireRole([UserRole.DOCTOR, ...])`.
- [ ] No wildcard or unrestricted clinical access granted by default.
- [ ] System administrators do NOT receive automatic unrestricted access to confidential clinical patient notes without audited justification.

## 3. Record-Level Authorization & IDOR Defense
- [ ] Resource owner check applied: Patients are verified using `req.user.patientProfileId === targetPatientId`.
- [ ] Attending physician check: Doctor must have an active appointment or encounter with the patient.
- [ ] Billing segregation: Billing staff view only fee schedules and item codes, never clinical notes or diagnoses.

## 4. Patient Consent Directives
- [ ] Consent verified in `ConsentRecord` table for sensitive data sharing (`CLINICAL_DATA_SHARING` / `LAB_DATA_ACCESS`).
- [ ] Revoked consent immediately blocks subsequent read operations.

## 5. Audit Logging
- [ ] Action name, entity type, operator ID, operator role, IP, and correlation ID logged to append-only `AuditLog`.

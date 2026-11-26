# MediCore – Technical Review & Architecture Interview Guide

This guide contains **26 in-depth technical questions and answers** covering the architecture, code implementation, security safeguards, concurrency controls, database design, and clinical interoperability of the MediCore platform.

---

## Section 1: Architecture & Full-Stack Fundamentals

### Q1: What is the high-level architecture of MediCore and why was a monorepo approach chosen?
**Answer:**  
MediCore is structured as a TypeScript/Python monorepo divided into:
- `packages/shared`: Shared TypeScript types, Zod validation schemas, enums (`UserRole`, `AppointmentStatus`), and FHIR R4 interfaces.
- `apps/frontend`: Next.js 14 App Router application with Tailwind CSS, TanStack Query, and Framer Motion.
- `apps/backend`: Modular Node.js / Express.js REST API with JWT authentication, RBAC, and transactional concurrency controls.
- `apps/analytics-service`: Python FastAPI microservice utilizing Pandas, NumPy, and Pydantic for high-throughput laboratory dataset validation and clinical metric calculation.
- `database`: PostgreSQL schema, Prisma ORM, and idempotent SQL migrations.

The monorepo ensures **single-source-of-truth type safety**: any update to an appointment status enum or prescription schema in `packages/shared` immediately typechecks across both the backend controllers and frontend forms, preventing contract drift.

---

### Q2: How does MediCore handle application-level state and data caching on the frontend?
**Answer:**  
MediCore uses a two-tiered client state architecture:
1. **`AuthContext.tsx`**: Manages global authentication identity, active JWT bearer token, current user role, and logout teardown.
2. **TanStack Query (React Query)**: Handles all server state (appointments, patients, lab orders, invoices). Queries utilize declarative keys (e.g. `['appointments', role, date]`), enabling automated stale-time caching, background refetching, and optimistic UI updates upon status mutations.

---

### Q3: How are roles segregated across the frontend user experience?
**Answer:**  
Role-based segregation operates through:
- **`Sidebar.tsx`**: Filtered navigation items based on the active role (`patient`, `doctor`, `nurse`, `receptionist`, `lab_technician`, `billing_officer`, `hospital_administrator`).
- **Route Guards in `/dashboard`**: The base `/dashboard` page inspects `user.role` from `AuthContext` and automatically redirects the client to their specific route (e.g. `/dashboard/doctor`).
- **Server-Side Enforcement**: Frontend UI hides buttons for unauthorized actions, but the Express backend independently enforces RBAC on every API route via `rbac.middleware.ts`, rejecting unauthorized calls with HTTP `403 Forbidden`.

---

## Section 2: Concurrency & Database Architecture

### Q4: How does MediCore prevent simultaneous double-booking of doctors (Assessment 07 & 12)?
**Answer:**  
Double-booking is prevented through dual-layer synchronization:
1. **Application-Level Mutex Queue (`apps/backend/src/database/store.ts`)**:
   Booking logic executes within `runTransaction`, an asynchronous mutex runner that serializes database mutations affecting provider availability.
2. **Database-Level Unique Compound Constraint (`database/prisma/schema.prisma`)**:
   ```prisma
   @@unique([doctorId, scheduledAt], name: "unique_doctor_schedule_slot")
   ```
   If two HTTP requests bypass network latency at the same millisecond, the database engine enforces this constraint: the first transaction commits atomically, while the second triggers a unique constraint violation and aborts with an HTTP `409 Conflict`.
   This is verified by our automated test in `apps/backend/src/tests/concurrency.test.ts`.

---

### Q5: What database normalization strategy was adopted for clinical records?
**Answer:**  
The PostgreSQL schema adheres to **Third Normal Form (3NF)**:
- Demographic data (`User`, `PatientProfile`, `DoctorProfile`) is decoupled from transactional data.
- Medical records follow a clinical hierarchy: `Appointment` -> `Encounter` -> `VitalSigns` (1:1), `Diagnosis` (1:N), `Prescription` (1:N) -> `PrescriptionItem` (1:N), `LabOrder` (1:N) -> `LabResult` (1:1).
- Financial billing (`Invoice`, `InvoiceItem`, `Payment`) is stored in independent relational tables referencing only the `encounterId` and `patientId`, ensuring financial audits do not require querying sensitive clinical notes.

---

### Q6: How are database migrations managed safely in a production clinical environment?
**Answer:**  
All schema changes are tracked via Prisma migrations in `database/migrations/`. We follow zero-downtime database deployment practices:
1. New columns are initially introduced as **nullable** or with safe default values.
2. Deprecated columns are phased out in multiple releases: code stop-reading -> code stop-writing -> schema column drop.
3. Every migration undergoes peer review against `docs/architecture/migration_review_checklist.md` before merging into `main`.

---

## Section 3: Clinical Security, Privacy & Compliance

### Q7: Explain the JWT authentication lifecycle and session revocation mechanism.
**Answer:**  
- **Access Tokens**: Short-lived (15 minutes), signed with `JWT_SECRET`, containing minimal claims: `{ userId, email, role }`.
- **Refresh Tokens**: Long-lived (7 days), signed with `JWT_REFRESH_SECRET`, stored hashed in the `RefreshToken` database table.
- **Token Rotation**: Each call to `/api/v1/auth/refresh` revokes the old refresh token and issues a new cryptographic pair.
- **Session Revocation**: When a user logs out (`/api/v1/auth/logout`), their active refresh token is marked `revoked: true` in the database, preventing replay attacks even if the token was compromised.

---

### Q8: How does MediCore protect against Insecure Direct Object References (IDOR)?
**Answer:**  
IDOR protection is enforced at the controller and middleware level by `record-auth.middleware.ts`:
- When a client queries `/api/v1/patients/:id`, the middleware verifies:
  1. Is the caller an administrator or receptionist? (Allowed demographic view).
  2. Is the caller the patient themselves (`req.user.userId === patient.userId`)? (Allowed).
  3. Is the caller a doctor currently assigned to an active encounter with this patient? (Allowed).
  4. If none of the above match, the request immediately terminates with HTTP `403 Forbidden`.
Tested and verified in `apps/backend/src/tests/record-auth.test.ts`.

---

### Q9: Why are Hospital Administrators restricted from viewing raw clinical notes?
**Answer:**  
In healthcare compliance (HIPAA Minimum Necessary standard), operational staff must not have unrestricted access to protected health information (PHI). In MediCore:
- Administrators can view operational dashboards, doctor scheduling rosters, appointment counts, and audit logs.
- Administrators attempting to query `/api/v1/encounters/:id` receive HTTP `403 Forbidden` unless granted explicit consent for an operational quality audit.

---

### Q10: How does the patient consent mechanism operate?
**Answer:**  
Patients manage their data sharing directives via `/dashboard/patient`. Directives are stored in the `Consent` model with status (`ACTIVE`, `REVOKED`) and category (`RESEARCH`, `EXTERNAL_REFERRAL`, `HISTORICAL_RECORDS`).
When a practitioner queries records outside their active care window, `consent.middleware.ts` queries the active consent status. If revoked, clinical records are filtered out of the response payload.

---

### Q11: How is rate limiting implemented to mitigate brute-force and DoS attacks?
**Answer:**  
MediCore implements an in-memory token bucket rate limiter in `rate-limit.middleware.ts`:
- **Authentication Endpoints** (`/api/v1/auth/*`): 10 requests per minute per IP address.
- **General Clinical Endpoints** (`/api/v1/*`): 100 requests per minute per IP address.
Excess requests are rejected with HTTP `429 Too Many Requests` accompanied by a `Retry-After` header.

---

## Section 4: Python Clinical Data Processing & FastAPI Analytics

### Q12: Why is the analytics engine built with Python and FastAPI instead of Node.js?
**Answer:**  
Python offers a mature data science and numerical computing ecosystem:
- **Pandas and NumPy**: Enable vectorised validation and statistical aggregation across 10,000+ laboratory results in milliseconds.
- **FastAPI with Pydantic**: Provides native asynchronous performance (comparable to Node.js) with strict runtime schema validation, automated Swagger docs, and clean Python type hinting.
- **Architectural Separation**: Decoupling compute-heavy data analysis from the Express transactional server ensures patient check-ins and appointments remain snappy even during intensive analytical batch runs.

---

### Q13: What checks are performed during laboratory dataset validation (Assessment 05)?
**Answer:**  
`processing/validator.py` applies three layers of validation:
1. **LOINC Standardization**: Verifies that test codes match valid international definitions (e.g. `2345-7` for Glucose, `4548-4` for HbA1c).
2. **Biological Reference Ranges**: Compares numeric findings against established physiological limits, tagging values as `NORMAL`, `LOW`, `HIGH`, or `CRITICAL`.
3. **Data Integrity & Imputation**: Handles missing optional fields, isolates unparseable text in numeric columns, and rejects records with missing patient identifiers.

---

### Q14: How are hospital wait times calculated in the FastAPI service?
**Answer:**  
The wait time metric measures the duration from patient check-in to clinician consultation:
$$\text{Wait Time} = \text{Encounter Start Time} - \text{Appointment Check-In Time}$$
`processing/reporter.py` filters appointments with both timestamps, computes the elapsed minutes per encounter, and calculates the mean and 90th percentile wait times grouped by department and day of the week.

---

### Q15: How does the Python microservice ensure it does not produce medical diagnoses?
**Answer:**  
To adhere strictly to regulatory boundaries, the service output schemas are explicitly designed for **operational statistics and data quality flags only**:
- Permitted output: `total_tests`, `abnormal_count`, `turnaround_time_hours`, `data_quality_score`.
- Forbidden output: Disease diagnostic predictions, treatment suggestions, or prescriptive medical advice.

---

## Section 5: Clinical Workflows & Interoperability

### Q16: Describe the state machine of an appointment in MediCore.
**Answer:**  
The appointment transitions through strictly enforced lifecycle states:
1. `SCHEDULED`: Initial state upon patient or receptionist booking.
2. `CONFIRMED`: System confirms availability or receptionist verifies insurance.
3. `CHECKED_IN`: Patient arrives at the clinic; arrival timestamp is recorded.
4. `IN_PROGRESS`: Clinician opens the consultation encounter.
5. `COMPLETED`: Clinician finalizes notes, diagnoses, and orders; triggers invoice creation.
6. `CANCELLED`: Terminal state if cancelled by patient or clinic prior to check-in.

---

### Q17: How is HL7 FHIR R4 interoperability implemented?
**Answer:**  
MediCore maps internal relational records to standardized FHIR R4 JSON schemas:
- `Patient` -> `FHIR Patient` (Identifier MRN, Telecom, Address, Gender).
- `Appointment` -> `FHIR Appointment` (Status, ServiceCategory, Participant).
- `Encounter` -> `FHIR Encounter` (Class AMB, Period, Diagnosis).
- `LabResult` -> `FHIR Observation` (Category Laboratory, Code LOINC, ValueQuantity).
Endpoints at `/api/v1/fhir/*` allow external Health Information Exchanges (HIEs) to query synthetic patient records seamlessly.

---

### Q18: How does the notification service guarantee message delivery without duplicate spam?
**Answer:**  
`integrations/notifications/notificationService.ts` incorporates **Idempotency Keys**:
- Every notification request requires an `Idempotency-Key` header (e.g. `appt-confirm-<apptId>`).
- If an automated retry occurs due to network latency, the service detects the existing key in cache and returns the previous delivery receipt without sending duplicate SMS or email messages.

---

## Section 6: Testing, DevOps & Incident Response

### Q19: What is the testing strategy for MediCore?
**Answer:**  
MediCore employs a pyramid testing strategy:
- **Unit & Schema Tests**: Validates Zod schemas and Pydantic models.
- **Integration Tests (Backend)**: 24 Jest tests using Supertest verifying auth lifecycles, RBAC permissions, record-level authorization, and appointment concurrency.
- **Microservice Tests (Python)**: 10 Pytest tests verifying LOINC validation algorithms, throughput benchmarks, and FastAPI analytics routes.
- **Frontend Build Verification**: Static compilation of all 15 routes in Next.js App Router.

---

### Q20: Explain Incident INC-01 (Simultaneous Double-Booking Conflict) and its resolution.
**Answer:**  
- **Symptom**: Under peak morning booking loads, two patients successfully booked the same doctor at the same 30-minute slot.
- **Root Cause**: The booking controller used a non-transactional check-then-insert pattern: Thread A checked availability, Thread B checked availability before Thread A inserted, and both proceeded to insert.
- **Fix**: Wrapped the booking sequence in `runTransaction` with an application-level mutex and applied a compound unique index `@@unique([doctorId, scheduledAt])` in PostgreSQL.

---

### Q21: Explain Incident INC-02 (Cross-Patient Lab Result Leakage / IDOR) and its resolution.
**Answer:**  
- **Symptom**: A patient observed another patient's laboratory panel by manually editing the URL parameter from `/patients/101` to `/patients/102`.
- **Root Cause**: Missing authorization middleware verifying that the authenticated user's ID matches the requested resource's owner.
- **Fix**: Implemented `record-auth.middleware.ts`, which enforces that patients can only retrieve records matching their own `userId`, while doctors can only view records of patients assigned to them.

---

### Q22: Explain Incident INC-03 (Doctor Schedule Timezone Shift) and its resolution.
**Answer:**  
- **Symptom**: Clinicians reported their appointment rosters were shifting by 5 hours after daylight saving adjustments.
- **Root Cause**: Date strings were formatted locally without explicit timezone offsets, causing the server to parse them in UTC while clients rendered in local time.
- **Fix**: Standardized all temporal data on **ISO 8601 UTC strings** (`YYYY-MM-DDTHH:mm:ss.sssZ`) on the wire, utilizing date-fns with explicit timezone formatting on the client.

---

### Q23: Explain Incident INC-04 (Prescription Pediatric Dosage Overflow) and its resolution.
**Answer:**  
- **Symptom**: A physician mistakenly typed an extra zero, submitting a 500mg dose of an antibiotic for an infant instead of 50mg.
- **Root Cause**: The prescription item input allowed unbounded integer values without patient-weight boundary checks.
- **Fix**: Enhanced the Zod prescription validation schema to enforce upper dose bounds and integrated a client-side warning banner whenever pediatric dosages exceed safe thresholds.

---

### Q24: Explain Incident INC-05 (Consent Revocation Access Bypass) and its resolution.
**Answer:**  
- **Symptom**: After a patient revoked external data sharing consent, an external research query still retrieved historical records.
- **Root Cause**: User permissions and consent statuses were cached in memory for 1 hour without cache invalidation on status change.
- **Fix**: Changed consent evaluation from a static session check to dynamic database evaluation in `consent.middleware.ts`, invalidating relevant cache keys immediately upon consent updates.

---

### Q25: How does the disaster recovery automation work in MediCore?
**Answer:**  
MediCore includes automated PowerShell disaster recovery scripts:
- **`scripts/backup-db.ps1`**: Executes `pg_dump` with gzip compression, generates a SHA-256 integrity hash, saves the archive with a UTC timestamp, and purges backups older than 30 days.
- **`scripts/restore-db.ps1`**: Verifies SHA-256 checksums to detect data corruption, takes a pre-restore safety snapshot of the target database, terminates open connections, and executes `pg_restore`.

---

### Q26: How does the Docker containerization strategy enforce least-privilege security?
**Answer:**  
- **Multi-Stage Builds**: Final runtime images contain only compiled JavaScript/Python and production dependencies; compilers, linters, and package managers are excluded.
- **Non-Root Execution**: Both Node.js and Python containers run under unprivileged user accounts (`nodejs:nodejs` and `appuser:appgroup`).
- **Network Isolation**: PostgreSQL and Redis are attached exclusively to an internal Docker bridge network (`backend-net`) with zero exposed ports on the host system.

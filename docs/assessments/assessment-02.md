# Assessment 02: Hospital Backend REST APIs

## 1. Assessment Overview & Objectives
Assessment 02 evaluates the implementation of modular, enterprise-grade RESTful APIs using Node.js, Express, and TypeScript. All hospital operations—from patient registration and doctor scheduling to encounters, diagnoses, prescriptions, lab orders, billing, consent, and auditing—are exposed via standardized endpoints with validation, pagination, filtering, correlation IDs, and uniform error structures.

## 2. Acceptance Criteria & Implementation Matrix
| Requirement | Status | Implementation Details |
|---|---|---|
| Modular Express Architecture | Verified | Separated routes, controllers, middleware, and database access layer in `apps/backend/src` |
| Standardized Response Envelope | Verified | All responses follow `{ success: true, data: ..., meta: ... }` format |
| Request Correlation ID | Verified | `request-id.middleware.ts` generates or propagates `X-Request-ID` via UUID v4 |
| Centralized Error Handling | Verified | `error.middleware.ts` maps validation, auth, and business errors to uniform HTTP statuses |
| Server-Side Validation | Verified | Request bodies validated against Zod schemas from `@medicore/shared` |
| Pagination & Filtering | Verified | List endpoints support `page`, `limit`, `status`, and date filters with metadata |
| Audit Logging Middleware | Verified | `audit.middleware.ts` logs mutations with user ID, IP, user-agent, and action |
| API Versioning | Verified | All routes namespaced under `/api/v1` |

## 3. Endpoints Matrix
| Resource | Method | Path | Description | Access Control |
|---|---|---|---|---|
| Auth | POST | `/api/v1/auth/register` | Patient registration | Public |
| Auth | POST | `/api/v1/auth/login` | Sign-in & token generation | Public |
| Auth | POST | `/api/v1/auth/refresh` | Access token refresh | Public (Refresh Token) |
| Auth | POST | `/api/v1/auth/logout` | Revoke session | Authenticated |
| Departments | GET | `/api/v1/departments` | List hospital departments | Authenticated |
| Doctors | GET | `/api/v1/doctors` | List doctors with schedules | Authenticated |
| Patients | GET | `/api/v1/patients` | List patients (filtered) | Staff / Admin |
| Patients | GET | `/api/v1/patients/:id` | Get patient record | Record-level / Consent |
| Appointments | GET | `/api/v1/appointments` | List appointments | Role-filtered |
| Appointments | POST | `/api/v1/appointments` | Book appointment | Patient / Receptionist |
| Appointments | PATCH | `/api/v1/appointments/:id/status` | Update status (Check-in, Cancel) | Doctor / Receptionist |
| Encounters | POST | `/api/v1/encounters` | Create clinical encounter | Doctor |
| Encounters | PATCH | `/api/v1/encounters/:id/vitals` | Record patient vitals | Nurse / Doctor |
| Prescriptions | POST | `/api/v1/prescriptions` | Create e-prescription | Doctor |
| Lab Orders | POST | `/api/v1/lab/orders` | Create lab requisition | Doctor |
| Lab Orders | POST | `/api/v1/lab/orders/:id/results` | Submit lab findings | Lab Tech |
| Billing | GET | `/api/v1/billing/invoices` | List billing invoices | Billing / Admin / Patient |
| Billing | POST | `/api/v1/billing/invoices/:id/pay` | Settle invoice payment | Billing / Patient |
| Consents | GET | `/api/v1/consents` | Get consent preferences | Patient / Doctor / Admin |
| Audit Logs | GET | `/api/v1/audit/logs` | Review security audit trail | Administrator Only |

## 4. Verification & Testing
Automated integration tests verify route authorization and response formatting:
```bash
npm --workspace=apps/backend run test -- auth.test.ts
# PASS apps/backend/src/tests/auth.test.ts
# ✓ POST /api/v1/auth/login succeeds with valid credentials
# ✓ POST /api/v1/auth/login fails with invalid credentials
# ✓ POST /api/v1/auth/refresh rotates tokens
# ✓ POST /api/v1/auth/logout revokes refresh token
```

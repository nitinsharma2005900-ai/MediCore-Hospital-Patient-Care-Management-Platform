## Assessment 02 — Hospital backend APIs

**Original PDF objective:** Implement patient registration, provider schedules, appointments, encounters, prescriptions, lab orders, results, billing, and consent endpoints with validation and audit hooks.

**Status:** Completed and verified

**Implementation and limitations:** Clinical writes, scheduling, billing, consent, staff and department operations are implemented. Role policy is fixed in code.

**Source files:** `apps/backend/src/controllers; routes; packages/shared/src/index.ts`.

**Endpoints / scope:** 62 registered operations under /api/v1.

**Tests and evidence:** Jest workflow/security tests; scripts/verify_postgres.cjs. Actual execution results are in TEST_REPORT.md, with machine-readable records in docs/evidence. Deployment and review limitations are not treated as passed tests.

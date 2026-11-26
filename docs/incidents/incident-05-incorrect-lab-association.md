# Simulation 05: Incorrect laboratory result association

**Reproduction:** Submit a result whose patient differs from the parent lab order, then try the equivalent direct SQL insert.

**Root cause:** Some parent/child associations were checked only in controllers and could be bypassed outside the API.

**Implemented correction:** The server rejects mismatches and PostgreSQL composite foreign keys bind lab result -> order -> encounter -> appointment to the same patient.

**Recovery verification:** The API returns 400 PATIENT_MISMATCH; direct SQL rejects the association with SQLSTATE 23503; a correct result is entered, reviewed and released.

**Regression/evidence:** `workflow.test.ts; postgres-results.json; postgres-run.log` in docs/evidence and source tests.

**Prevention:** Retain composite foreign keys and negative association tests; review every clinical schema change.

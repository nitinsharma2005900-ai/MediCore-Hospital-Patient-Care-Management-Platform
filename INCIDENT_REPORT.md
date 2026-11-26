# Controlled incident simulations

These are real, controlled local tests using synthetic data, not production incidents. No unrelated database or Redis service was stopped. Error logs contain technical events and opaque request IDs, without secrets or clinical payloads.

# Simulation 01: Unauthorized clinical record access

**Reproduction:** Call a different patient chart as the demo patient, and call a full chart as an administrator.

**Root cause:** Unauthenticated FHIR routes and several role-only checks exposed records without a care relationship.

**Implemented correction:** Central scope middleware enforces ownership, clinician/nurse assignment and scoped consent. FHIR collections and identifiers enforce the same policy.

**Recovery verification:** Both requests return 403; an ACCESS_DENIED audit row is stored.

**Regression/evidence:** `security-regression.test.ts; postgres-results.json; postgres-run.log` in docs/evidence and source tests.

**Prevention:** Keep resource-level authorization close to every collection and identifier handler; review access-control changes.


# Simulation 02: Appointment conflict

**Reproduction:** Send two competing bookings for one provider/time. Also insert an overlapping appointment directly in SQL.

**Root cause:** A process-local mutex protected only one in-memory API instance. Timestamp-without-time-zone conversion also shifted persisted slots.

**Implemented correction:** PostgreSQL transactions, a transaction advisory lock and an independent GiST exclusion constraint on timestamptz ranges protect every writer.

**Recovery verification:** Competing HTTP requests produce 201 and 409; direct SQL rejects overlap with SQLSTATE 23P01.

**Regression/evidence:** `concurrency.test.ts; workflow-regression.test.ts; postgres-results.json` in docs/evidence and source tests.

**Prevention:** Keep the database constraint and timezone regression when changing scheduling; review migrations.


# Simulation 03: Delayed notifications

**Reproduction:** Inject one controlled sandbox delivery failure; then stop the dedicated Redis instance while a message is pending.

**Root cause:** The original worker kept an in-memory array and could lose or silently drop jobs.

**Implemented correction:** BullMQ uses three retries with backoff; PostgreSQL stores a durable outbox and delivery ledger. Requeue the failed job through the controlled test recovery.

**Recovery verification:** Three failures are recorded, controlled retry delivers once, and a message created during Redis outage is delivered after Redis restarts.

**Regression/evidence:** `verify_outages.cjs; outage-results.json; outage-run.log` in docs/evidence and source tests.

**Prevention:** Monitor failures and delivery age. Use the durable outbox to repopulate Redis after data loss. Production needs a supervised worker.


# Simulation 04: Database outage

**Reproduction:** Stop only this session-owned PostgreSQL cluster on 127.0.0.1:5546; request /ready and a business endpoint; restart it.

**Root cause:** The initial readiness check only counted in-memory users and therefore could not detect a real database outage.

**Implemented correction:** Readiness queries PostgreSQL; API operations fail closed with a safe 503. Pool reconnection and graceful startup are implemented.

**Recovery verification:** Both endpoints return 503 during the outage; readiness returns 200 after restart and patient counts remain unchanged.

**Regression/evidence:** `verify_outages.cjs; outage-results.json; outage-run.log; backup-restore.json` in docs/evidence and source tests.

**Prevention:** Alert on readiness failures, keep backups and prove isolated restores. Never switch silently to synthetic fallback data.


# Simulation 05: Incorrect laboratory result association

**Reproduction:** Submit a result whose patient differs from the parent lab order, then try the equivalent direct SQL insert.

**Root cause:** Some parent/child associations were checked only in controllers and could be bypassed outside the API.

**Implemented correction:** The server rejects mismatches and PostgreSQL composite foreign keys bind lab result -> order -> encounter -> appointment to the same patient.

**Recovery verification:** The API returns 400 PATIENT_MISMATCH; direct SQL rejects the association with SQLSTATE 23503; a correct result is entered, reviewed and released.

**Regression/evidence:** `workflow.test.ts; postgres-results.json; postgres-run.log` in docs/evidence and source tests.

**Prevention:** Retain composite foreign keys and negative association tests; review every clinical schema change.

# Simulation 02: Appointment conflict

**Reproduction:** Send two competing bookings for one provider/time. Also insert an overlapping appointment directly in SQL.

**Root cause:** A process-local mutex protected only one in-memory API instance. Timestamp-without-time-zone conversion also shifted persisted slots.

**Implemented correction:** PostgreSQL transactions, a transaction advisory lock and an independent GiST exclusion constraint on timestamptz ranges protect every writer.

**Recovery verification:** Competing HTTP requests produce 201 and 409; direct SQL rejects overlap with SQLSTATE 23P01.

**Regression/evidence:** `concurrency.test.ts; workflow-regression.test.ts; postgres-results.json` in docs/evidence and source tests.

**Prevention:** Keep the database constraint and timezone regression when changing scheduling; review migrations.

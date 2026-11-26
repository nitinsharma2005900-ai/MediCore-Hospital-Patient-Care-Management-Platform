# Simulation 03: Delayed notifications

**Reproduction:** Inject one controlled sandbox delivery failure; then stop the dedicated Redis instance while a message is pending.

**Root cause:** The original worker kept an in-memory array and could lose or silently drop jobs.

**Implemented correction:** BullMQ uses three retries with backoff; PostgreSQL stores a durable outbox and delivery ledger. Requeue the failed job through the controlled test recovery.

**Recovery verification:** Three failures are recorded, controlled retry delivers once, and a message created during Redis outage is delivered after Redis restarts.

**Regression/evidence:** `verify_outages.cjs; outage-results.json; outage-run.log` in docs/evidence and source tests.

**Prevention:** Monitor failures and delivery age. Use the durable outbox to repopulate Redis after data loss. Production needs a supervised worker.

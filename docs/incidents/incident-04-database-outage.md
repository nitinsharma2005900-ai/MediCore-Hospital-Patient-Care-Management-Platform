# Simulation 04: Database outage

**Reproduction:** Stop only this session-owned PostgreSQL cluster on 127.0.0.1:5546; request /ready and a business endpoint; restart it.

**Root cause:** The initial readiness check only counted in-memory users and therefore could not detect a real database outage.

**Implemented correction:** Readiness queries PostgreSQL; API operations fail closed with a safe 503. Pool reconnection and graceful startup are implemented.

**Recovery verification:** Both endpoints return 503 during the outage; readiness returns 200 after restart and patient counts remain unchanged.

**Regression/evidence:** `verify_outages.cjs; outage-results.json; outage-run.log; backup-restore.json` in docs/evidence and source tests.

**Prevention:** Alert on readiness failures, keep backups and prove isolated restores. Never switch silently to synthetic fallback data.

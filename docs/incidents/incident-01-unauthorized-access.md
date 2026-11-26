# Simulation 01: Unauthorized clinical record access

**Reproduction:** Call a different patient chart as the demo patient, and call a full chart as an administrator.

**Root cause:** Unauthenticated FHIR routes and several role-only checks exposed records without a care relationship.

**Implemented correction:** Central scope middleware enforces ownership, clinician/nurse assignment and scoped consent. FHIR collections and identifiers enforce the same policy.

**Recovery verification:** Both requests return 403; an ACCESS_DENIED audit row is stored.

**Regression/evidence:** `security-regression.test.ts; postgres-results.json; postgres-run.log` in docs/evidence and source tests.

**Prevention:** Keep resource-level authorization close to every collection and identifier handler; review access-control changes.

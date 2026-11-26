## Assessment 15 — Healthcare incident simulation

**Original PDF objective:** Investigate unauthorized record access, appointment conflict, delayed notifications, database outage, and incorrect lab result association. Provide an incident report and evidence.

**Status:** Completed and verified

**Implementation and limitations:** All incidents are controlled local simulations against synthetic data. They are not production incidents.

**Source files:** `INCIDENT_REPORT.md; docs/incidents; verify_outages.cjs`.

**Endpoints / scope:** Unauthorized access, collision, queue delay, database outage and lab association.

**Tests and evidence:** Real PostgreSQL, queue and outage evidence. Actual execution results are in TEST_REPORT.md, with machine-readable records in docs/evidence. Deployment and review limitations are not treated as passed tests.

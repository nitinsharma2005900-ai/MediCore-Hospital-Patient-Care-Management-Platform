## Assessment 14 — Secure hospital deployment

**Original PDF objective:** Deploy with HTTPS, least-privilege infrastructure access, secret management, backups, restore validation, audit retention, monitoring, and documented incident contacts.

**Status:** Partially completed

**Implementation and limitations:** Three free services are live, using private existing datastore instances with a separate MediCore database/login and Redis database 2. All seven roles, care/billing/privacy, analytics and queue delivery were exercised. Off-host cloud backups, retention archival, a separate migration owner, dedicated worker and production availability remain outstanding.

**Source files:** `render.yaml; DEPLOYMENT_GUIDE.md; bootstrap_render_database.cjs; verify_live.cjs`.

**Endpoints / scope:** Public HTTPS frontend, Express API and FastAPI on Render.

**Tests and evidence:** render-deployment.json; live-results.json; live-playwright-results.json; genuine cloud screenshots. Actual execution results are in TEST_REPORT.md, with machine-readable records in docs/evidence. Deployment and review limitations are not treated as passed tests.

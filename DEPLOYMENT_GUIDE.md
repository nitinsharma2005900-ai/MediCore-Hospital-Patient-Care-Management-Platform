# Deployment and recovery guide

## Actual status

Source repository: [https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform](https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform). Render is not connected to this session. There is **no verified public Render application or API URL**. Local services and real GitHub CI/Docker execution are verified separately; they are not evidence of cloud deployment.

## Windows localhost

This checkout uses 3010 (Next.js), 4010 (Express), 8010 (FastAPI), 5546 (dedicated PostgreSQL), 6386 (dedicated Redis). Existing applications on 3000/4000/8000/5432/6379 were preserved. `setup-local.ps1` creates a new synthetic database cluster and random ignored local secrets; it does not modify the other projects.

```powershell
Set-Location 'C:\Users\amits\Downloads\MediCore_Complete_Project'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-local.ps1
npm ci
python -m pip install -r apps/analytics-service/requirements.txt
npm run build --workspace=packages/shared
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

The script loads ignored `.env`, starts applications hidden, and writes process information/logs under `.runtime`. The API applies ordered SQL migrations under a migration lock; synthetic seed data is added only if the database is empty and SEED_DEMO=true. It never reseeds a populated database on restart. Stop only the process IDs listed in `.runtime/services.json`, after confirming the command and project path.

## Docker

Copy `.env.example` to `.env` on a separate installation; generate a database password and distinct random JWT secrets. Set POSTGRES_PASSWORD and JWT variables. Do not overwrite an existing `.env` containing local secrets. Then:

```powershell
docker compose config --quiet
docker compose up -d --build --wait
```

The six services include a dedicated worker. PostgreSQL and Redis have private networks, persistent volumes and no published ports. Frontend/API/analytics ports are loopback-only. Application containers run without root. GitHub Actions checks the actual builds, Compose health, non-root UIDs and datastore port isolation. Docker is not installed on this Windows host.

## Render account action required

1. Connect the Render plugin in ChatGPT or sign into the [Render dashboard](https://dashboard.render.com/). Authorize the private GitHub repository above. No credential should be pasted into chat or committed.
2. Inspect existing services, regions and the workspace's free database/Key Value limits. Reuse only compatible MediCore resources; do not point MediCore at another project's business database. Review the Blueprint preview for duplicates before approving it.
3. Review `render.yaml`. All declared plans are free. The free alternative runs the same BullMQ consumer within the API process; a dedicated paid worker must not be purchased without approval.
4. For a predictable first deployment, create/reuse datastores, deploy backend, deploy analytics with the actual backend HTTPS URL, then build frontend with both actual service HTTPS URLs. Free web services cannot receive private-network traffic, so their public HTTPS URLs are required for service-to-service HTTP. Database/Redis connections use private service URLs.
5. Backend: repository root; build `npm ci && npm run build --workspace=packages/shared && npm run build --workspace=apps/backend`; start `node apps/backend/dist/server.js`; health `/ready`. Supply DATABASE_URL, REDIS_URL, distinct generated JWT secrets, exact frontend CORS_ORIGIN, SEED_DEMO=true for this synthetic demo, RUN_WORKER=true. Bind dynamically to Render's PORT on 0.0.0.0.
6. Analytics: root; build `pip install -r apps/analytics-service/requirements.txt`; start `uvicorn main:app --app-dir apps/analytics-service --host 0.0.0.0 --port $PORT`; health `/health`; set BACKEND_BASE_URL to the actual API HTTPS origin and exact CORS_ORIGIN.
7. Frontend: root; build `npm ci && npm run build --workspace=packages/shared && npm run build --workspace=apps/frontend`; start `npm run start --workspace=apps/frontend`. Set BACKEND_BASE_URL and ANALYTICS_SERVICE_URL to the actual HTTPS origins **before building**, because rewrites are compiled. Browser API calls use the same frontend origin. The startup helper serves the standalone build with the dynamic PORT.
8. Validate all seven logins, the complete workflow, denial cases, persistence after restart, both Swagger UIs, analytics, queue delivery and HTTPS in a fresh browser session. Record actual URLs and screenshots only after verification. No localhost API origin belongs in production variables.

Render provides managed HTTPS for its default domains. Custom DNS requires an actual owned domain and configured records; none was provisioned. Free PostgreSQL expires after 30 days, free Key Value is not durable, free web services sleep and no dedicated free worker exists. Free managed database backups are unavailable. See [Render free plans](https://render.com/docs/free), [Blueprint reference](https://render.com/docs/blueprint-spec), and [worker plans](https://render.com/docs/migrate-from-heroku). No paid service or subscription was purchased.

## Backup / restore and operations

`python scripts/verify_backup.py` creates a real custom-format pg_dump archive in ignored `.runtime`, restores into a new uniquely named disposable database, compares counts/constraints, then removes only that disposable database. Evidence is in docs/evidence/backup-restore.json. `scripts/run-backup.ps1` creates an actual backup plus SHA-256 file and fails if pg_dump fails. It never produces a simulated success.

For a production restore, first verify the SHA-256, capture a fresh pre-restore backup, isolate writes, restore into a separate target, compare row counts and critical constraints, then perform an explicitly approved cutover. The provided verification tool deliberately does not overwrite the application database. Configure off-host encrypted backups and test recovery before treating a deployment as production. Cloud backup and retention archival are not configured/verified here.

Monitor `/health`, `/ready`, structured request IDs, queue attempts and delivery backlog. Audit rows reject update/delete. No automated deletion or claimed retention certification is configured. Incident contact: Nitin Sharma, repository owner; use the project's issue tracker for synthetic technical issues, never patient information. A real operational contact and escalation schedule must be configured before real deployment.

## GitHub release controls

The CI workflow runs tests, lint/type checks, npm audit, migration validation, Playwright and Docker/Compose. Deployment is manual workflow_dispatch with separate staging/production environments and secret Render deploy hooks. Configure real environment reviewers, three deploy-hook secrets and public endpoint variables before use. Private branch protection was rejected with HTTP 403 on this account; see docs/evidence/github-protection.log. No peer review, staging release or live Render release is claimed.

No external AI, FHIR, SMTP or SMS API key is needed for the verified local demo. FHIR and outbound messages are explicitly local mock/simulator integrations.

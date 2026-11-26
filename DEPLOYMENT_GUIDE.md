# Deployment and recovery guide

## Actual status

Source repository: [https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform](https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform). The complete synthetic application is deployed and verified on Render:

- Website: https://medicore-nitinsharma.onrender.com
- Express API: https://medicore-api-nitinsharma.onrender.com/api/v1
- API readiness: https://medicore-api-nitinsharma.onrender.com/ready
- Express Swagger: https://medicore-api-nitinsharma.onrender.com/api-docs/
- FastAPI: https://medicore-analytics-nitinsharma.onrender.com/health
- FastAPI Swagger: https://medicore-analytics-nitinsharma.onrender.com/docs

Actual deploy IDs, source revisions, free plans, private connectivity checks and public verification are in docs/evidence/render-deployment.json, live-results.json and live-playwright-results.json. This is a free educational demonstration, with the limitations below.

## Windows localhost

This checkout uses 3010 (Next.js), 4010 (Express), 8010 (FastAPI), 5546 (dedicated PostgreSQL), 6386 (dedicated Redis). Existing applications on 3000/4000/8000/5432/6379 were preserved. `setup-local.ps1` creates a new synthetic database cluster and random ignored local secrets; it does not modify the other projects.

```powershell
Set-Location 'C:\Users\amits\Downloads\MediCore_Complete_Project'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-local.ps1
npm ci
py -3.13 -m pip install -r apps/analytics-service/requirements.txt
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

## Render configuration and redeployment

1. Render CLI authorization was completed in the browser. The official CLI and API were used because the Render plugin was unavailable. Never paste control-plane credentials into chat, app variables, Git or documentation.
2. The Singapore workspace already contained free PostgreSQL and Key Value instances. A separate `medicore_demo_20261126` database and restricted `medicore_app_20261126` login were provisioned on that PostgreSQL instance. Existing business records were not changed. Redis URL selects logical database 2; BullMQ uses the medicore-notifications queue. Never run FLUSHALL or modify another project's data, users, network rules or plan.
3. `render.yaml` declares only the three MediCore free web services and accepts existing private datastore URLs via secret environment variables. It passed Render Blueprint validation. The same BullMQ consumer runs inside the API process; no paid worker was purchased. Autodeploy is off for controlled manual releases.
4. For a predictable first deployment, create/reuse datastores, deploy backend, deploy analytics with the actual backend HTTPS URL, then build frontend with both actual service HTTPS URLs. Free web services cannot receive private-network traffic, so their public HTTPS URLs are required for service-to-service HTTP. Database/Redis connections use private service URLs.
5. Backend: repository root; Node 22; build `npm ci --include=dev && npm run build --workspace=packages/shared && npm run build --workspace=apps/backend`; start `node apps/backend/dist/server.js`; health `/ready`. DATABASE_URL uses the restricted MediCore login and private hostname; REDIS_URL uses private database 2. Distinct random JWT secrets exist only in Render, exact frontend CORS_ORIGIN is configured, SEED_DEMO=true and RUN_WORKER=true. The app binds Render's PORT on 0.0.0.0. The one-time bootstrap script was verified with a non-superuser provisioner. Its temporary DATABASE_BOOTSTRAP_URL and start-command prefix were removed after provisioning; do not add them to ordinary redeploys.
6. Analytics: root; build `pip install -r apps/analytics-service/requirements.txt`; start `uvicorn main:app --app-dir apps/analytics-service --host 0.0.0.0 --port $PORT`; health `/health`; set BACKEND_BASE_URL to the actual API HTTPS origin and exact CORS_ORIGIN.
7. Frontend: root; Node 22; build `npm ci --include=dev && npm run build --workspace=packages/shared && npm run build --workspace=apps/frontend`; start `npm run start --workspace=apps/frontend`. BACKEND_BASE_URL and ANALYTICS_SERVICE_URL are the actual HTTPS origins **at build time**, because rewrites are compiled. Browser API calls use the same frontend origin. The startup helper serves the standalone build with the dynamic PORT.
8. Validate all seven logins, the complete workflow, denial cases, persistence after restart, both Swagger UIs, analytics, queue delivery and HTTPS in a fresh browser session. Record actual URLs and screenshots only after verification. No localhost API origin belongs in production variables.

Render provides managed HTTPS for its default domains. Custom DNS requires an actual owned domain and configured records; none was provisioned. Free PostgreSQL expires after 30 days, free Key Value is not durable, free web services sleep and no dedicated free worker exists. Free managed database backups are unavailable. See [Render free plans](https://render.com/docs/free), [Blueprint reference](https://render.com/docs/blueprint-spec), and [worker plans](https://render.com/docs/migrate-from-heroku). No paid service or subscription was purchased.

## Backup / restore and operations

`py -3.13 scripts/verify_backup.py` creates a real custom-format pg_dump archive in ignored `.runtime`, restores into a new uniquely named disposable database, compares counts/constraints, then removes only that disposable database. Evidence is in docs/evidence/backup-restore.json. `scripts/run-backup.ps1` creates an actual backup plus SHA-256 file and fails if pg_dump fails. It never produces a simulated success.

For a production restore, first verify the SHA-256, capture a fresh pre-restore backup, isolate writes, restore into a separate target, compare row counts and critical constraints, then perform an explicitly approved cutover. The provided verification tool deliberately does not overwrite the application database. Configure off-host encrypted backups and test recovery before treating a deployment as production. Cloud backup and retention archival are not configured/verified here.

Monitor `/health`, `/ready`, structured request IDs, queue attempts and delivery backlog. Audit rows reject update/delete. No automated deletion or claimed retention certification is configured. Incident contact: Nitin Sharma, repository owner; use the project's issue tracker for synthetic technical issues, never patient information. A real operational contact and escalation schedule must be configured before real deployment.

## GitHub release controls

The CI workflow runs tests, lint/type checks, npm audit, migration validation, Playwright and Docker/Compose. The verified live demo was deployed manually through the authorized official Render CLI. The workflow_dispatch release scaffold still requires real environment reviewers, three deploy-hook secrets and public endpoint variables before use. Private branch protection was rejected with HTTP 403 on this account; see docs/evidence/github-protection.log. No peer review or protected staging release is claimed.

No external AI, FHIR, SMTP or SMS API key is needed for the verified local demo. FHIR and outbound messages are explicitly local mock/simulator integrations.

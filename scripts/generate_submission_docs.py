from pathlib import Path
import json,re,xml.etree.ElementTree as ET,subprocess
from datetime import datetime,timezone,timedelta
root=Path(__file__).resolve().parent.parent
def load(name):
 p=root/name
 return json.loads(p.read_text(encoding='utf-8-sig')) if p.exists() else {}
def write(name,text):
 p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text.strip()+'\n',encoding='utf-8')
repo='https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform'
stamp=datetime.now(timezone(timedelta(hours=5,minutes=30))).strftime('%d %B %Y, %H:%M IST')
backend=load('docs/backend-tests.json');frontend=load('docs/evidence/frontend-tests.json');pg=load('docs/evidence/postgres-results.json');outage=load('docs/evidence/outage-results.json');browser=load('docs/evidence/playwright-results.json')
coverage=load('apps/backend/coverage/coverage-summary.json').get('total',{})
python=ET.parse(root/'docs/python-tests.xml').getroot();python_total=sum(int(s.attrib.get('tests',0)) for s in python.findall('.//testsuite'))
python_failed=sum(int(s.attrib.get('failures',0))+int(s.attrib.get('errors',0)) for s in python.findall('.//testsuite'))
browser_stats=browser.get('stats',{});browser_passed=browser_stats.get('expected',0);browser_failed=browser_stats.get('unexpected',0);browser_skipped=browser_stats.get('skipped',0)
counts=[('Backend Jest / Supertest (isolated memory fixtures)',backend.get('numTotalTests',0),backend.get('numPassedTests',0),backend.get('numFailedTests',0),backend.get('numPendingTests',0)),('React Testing Library / Vitest',frontend.get('numTotalTests',0),frontend.get('numPassedTests',0),frontend.get('numFailedTests',0),frontend.get('numPendingTests',0)),('Python pytest / HTTPX',python_total,python_total-python_failed,python_failed,0),('Real PostgreSQL integration checks',pg.get('total',0),pg.get('passed',0),pg.get('failed',0),0),('Playwright browser tests',browser_passed+browser_failed+browser_skipped,browser_passed,browser_failed,browser_skipped),('Controlled outage / queue checks',outage.get('total',0),outage.get('passed',0),outage.get('failed',0),0)]
live=load('docs/evidence/live-results.json');live_browser=load('docs/evidence/live-playwright-results.json').get('stats',{})
if live:
 counts.append(('Live Render API / workflow checks',live['total'],live['passed'],live['failed'],live.get('skipped',0)))
if live_browser:
 counts.append(('Live Render Playwright browser tests',sum(live_browser.get(k,0) for k in ['expected','unexpected','skipped']),live_browser.get('expected',0),live_browser.get('unexpected',0),live_browser.get('skipped',0)))
total=sum(x[1] for x in counts);passed=sum(x[2] for x in counts);failed=sum(x[3] for x in counts);skipped=sum(x[4] for x in counts)
ci=load('docs/evidence/github-ci.json')
ci_url=ci.get('url',repo+'/actions');ci_status=ci.get('conclusion') or ci.get('status','not captured')
items=[
('Healthcare role-based frontend','Completed and verified','apps/frontend/src/app/dashboard; components/WorkspaceSidebar.tsx; components/CareActions.tsx','Role dashboards; /appointments/book; /invoices/{id}','Playwright responsive.spec.ts, submission.spec.ts; frontend AuthContext.test.tsx','Seven dashboards verified at six widths; no claim that every possible UI state is exhaustively tested.'),
('Hospital backend APIs','Completed and verified','apps/backend/src/controllers; routes; packages/shared/src/index.ts','62 registered operations under /api/v1','Jest workflow/security tests; scripts/verify_postgres.cjs','Clinical writes, scheduling, billing, consent, staff and department operations are implemented. Role policy is fixed in code.'),
('Clinical relational database','Completed and verified','database/migrations; database/schema.sql; src/database/postgres.ts','All persistent business API operations','PostgreSQL integration; schema-evidence.json; backup-restore.json','24 tables including migration metadata; 51 foreign keys. pg is the active query layer; the Prisma file is a legacy reference.'),
('Clinical data security','Completed and verified','middlewares/scope.middleware.ts; auth.middleware.ts; controllers/auth.controller.ts','Authentication, clinical, billing, consent and FHIR APIs','security-regression.test.ts; PostgreSQL privacy checks','Server-side role, assignment, consent and ownership checks; token rotation/revocation; append-only audit trigger. No regulatory compliance claim.'),
('Python clinical data processing','Completed and verified','apps/analytics-service/processing; tests; sample_data','/processing/validate-lab-dataset; /processing/run-benchmark','pytest validator, security and benchmark tests','Missing identity, invalid units, non-finite values, malformed reference metadata and timestamps are tested. Synthetic data only.'),
('FastAPI clinical analytics','Completed and verified','routers/analytics.py; processing/reporter.py; operations.routes.ts','/analytics/appointment-utilization, waiting-times, lab-turnaround, population-metrics, department-statistics','pytest HTTPX transport fixtures; actual PostgreSQL-to-FastAPI integration','No invented fallback values. An authenticated administrator token is forwarded to the authoritative Express projection; unavailable data returns 503 or null metrics.'),
('Appointment and care workflow engine','Completed and verified','appointment.controller.ts; provider-workflow.controller.ts; services/availability.ts; SQL integrity migration','Appointments, waiting list, encounters, prescription/lab status transitions','workflow.test.ts; concurrency.test.ts; workflow-regression.test.ts; PostgreSQL checks','GiST exclusion constraint and transaction lock prevent overlaps. IANA zones and UTC instants are tested. Prescription/lab lifecycle transitions also exist as APIs.'),
('Healthcare interoperability','Partially completed','controllers/fhir.controller.ts; jobs/notifications.ts; integrations','/fhir/Patient, Appointment, Encounter, Observation; /notifications','Four authenticated FHIR resource checks; durable sandbox worker/outage tests','FHIR is an explicit local R4-shaped mock. EMAIL/SMS delivery is a local database-backed simulator; no SMTP provider or external SMS delivery is verified.'),
('Docker healthcare environment','Completed and verified','Dockerfiles; docker-compose.yml; .dockerignore','Frontend, API, analytics, PostgreSQL, Redis and separate worker','Actual GitHub Actions containers job and container runtime logs','Builds and full Compose runtime passed in GitHub Actions. Non-root application UIDs and unexposed database/Redis ports are checked. Docker is unavailable on this Windows host.'),
('Git and clinical change review','Partially completed','.github/CODEOWNERS; pull request template; review checklists; Git history','GitHub branches and pull request','Remote push/commit verification; github-protection.log','Original commit preserved; meaningful audit commits and feature branch pushed. GitHub rejected private-repository branch protection with HTTP 403. No peer approval is claimed.'),
('Healthcare CI/CD','Partially completed','.github/workflows/ci.yml; deploy.yml','GitHub Actions quality and container jobs; manual Render release hooks','Actual successful CI runs and downloaded artifacts; Render deploy records','Tests, lint, type checks, dependency audit, migrations, browser checks and containers run in CI. The live demo was released through the authorized Render CLI; staged release hooks and protected environment reviewers remain unverified.'),
('Privacy and workflow testing','Completed and verified','apps/backend/src/__tests__; analytics-service/tests; tests/e2e; scripts/verify_postgres.cjs','Success, validation, privacy, concurrency and dependency failure paths','TEST_REPORT.md and docs/evidence','Executed results and coverage are reported exactly. Coverage is partial; memory-fixture tests are distinguished from actual PostgreSQL checks.'),
('Healthcare API documentation','Completed and verified','src/swagger/openapi.json; postman collection; docs/API_REFERENCE.md','All 62 actual Express operations and five FastAPI analytics endpoints','Router inventory generation; OpenAPI validation; live Swagger checks','Request schemas, examples, errors and permission rules are documented. FHIR success responses differ from the standard REST envelope.'),
('Secure hospital deployment','Partially completed','render.yaml; DEPLOYMENT_GUIDE.md; bootstrap_render_database.cjs; verify_live.cjs','Public HTTPS frontend, Express API and FastAPI on Render','render-deployment.json; live-results.json; live-playwright-results.json; genuine cloud screenshots','Three free services are live, using private existing datastore instances with a separate MediCore database/login and Redis database 2. All seven roles, care/billing/privacy, analytics and queue delivery were exercised. Off-host cloud backups, retention archival, a separate migration owner, dedicated worker and production availability remain outstanding.'),
('Healthcare incident simulation','Completed and verified','INCIDENT_REPORT.md; docs/incidents; verify_outages.cjs','Unauthorized access, collision, queue delay, database outage and lab association','Real PostgreSQL, queue and outage evidence','All incidents are controlled local simulations against synthetic data. They are not production incidents.')]
assessment_data=[{'number':i+1,'name':name,'status':status,'summary':summary,'sources':sources,'endpoints':endpoints,'tests':tests} for i,(name,status,sources,endpoints,tests,summary) in enumerate(items)]
write('docs/evidence/assessment-status.json',json.dumps(assessment_data,indent=2))
table='| # | Assessment | Status |\n|---|---|---|\n'+'\n'.join(f'| {i+1:02} | {x[0]} | {x[1]} |' for i,x in enumerate(items))
test_table='| Suite | Executed | Passed | Failed | Skipped |\n|---|---:|---:|---:|---:|\n'+'\n'.join(f'| {n} | {t} | {p} | {f} | {s} |' for n,t,p,f,s in counts)+f'\n| **Total final recorded checks** | **{total}** | **{passed}** | **{failed}** | **{skipped}** |'
demo='| Role | Synthetic email |\n|---|---|\n'+'\n'.join(f'| {r} | `{e}@medicore.health` |' for r,e in [('Patient','patient'),('Receptionist','receptionist'),('Doctor','doctor'),('Nurse','nurse'),('Laboratory technician','labtech'),('Billing officer','billing'),('Administrator','admin')])+'\n\nAll seven synthetic demo accounts use `Password123!`. These credentials are intentionally public demo data. They do not grant infrastructure access. Do not use this configuration for real patient data.'
write('DEMO_ACCOUNTS.md','# Synthetic demo accounts\n\n'+demo)
write('TEST_REPORT.md',f'''# Actual test report

Recorded {stamp}. The table reports the latest complete recorded run of each suite, not every intermediate rerun during debugging.

{test_table}

## Coverage and builds

Backend Jest statement coverage: **{coverage.get('statements',{}).get('pct','not recorded')}%**; branch coverage: **{coverage.get('branches',{}).get('pct','not recorded')}%**; function coverage: **{coverage.get('functions',{}).get('pct','not recorded')}%**; line coverage: **{coverage.get('lines',{}).get('pct','not recorded')}%**. This is instrumentation for the Jest run; PostgreSQL and browser checks are additional coverage of behavior, not added to these percentages. Frontend/Python coverage percentages were not measured.

The Next.js production build, shared/backend TypeScript builds, frontend type check and ESLint pass. Actual outputs are in `docs/evidence/`. npm audit reports zero known vulnerabilities in both the complete installed tree and production dependencies at the captured run. No future security guarantee is implied.

GitHub CI: **{ci_status}**. [Captured run]({ci_url}). Three application Docker images and the six-service Compose environment were built and exercised in GitHub Actions. This computer has no Docker executable; local Docker execution was not performed.

## Verified boundaries

- Real PostgreSQL requests cover registration, role restriction, competing bookings, direct SQL exclusion, check-in, encounters, vitals, diagnoses, prescriptions, lab association, release, consent revocation, invoice/payment persistence, FHIR and FastAPI.
- Browser checks cover all seven roles at 360, 390, 768, 1024, 1440 and 1920 pixels; route protection, real appointment booking, landing pages and printable invoices. Separate Chromium runs cover localhost and the public Render app; cloud screenshots are in docs/screenshots/live.
- Outage checks actually stop and restart only the session-owned PostgreSQL cluster on port 5546 and Redis on 6386. They verify 503 responses, retained records, a durable notification outbox, three retries and controlled recovery.
- A real `pg_dump` archive was restored into a new disposable database. Row counts and critical constraints matched. The application database was not overwritten.

## Failures found and corrected

The initial project used memory despite claiming PostgreSQL verification. A direct SQL overlap test exposed timestamp conversion drift, corrected by the `timestamptz` migration. Browser checks exposed missing Tailwind utilities on Windows and overflowing patient tabs; both were fixed. The notification menu initially consumed the wrong API response shape; it now reads the actual envelope. Refresh replay/logout and unauthenticated FHIR access were corrected. Test fixture mistakes were corrected without removing or weakening security assertions.

No exhaustive test of every possible page state, assistive technology or production integration is claimed. Live synthetic checks cover HTTPS, seven roles, privacy, concurrent bookings, care, labs, billing, Redis delivery and authoritative FastAPI analytics. Initial live attempt failures and corrections are retained in docs/evidence/live-verification-notes.md. Full detailed results: `docs/backend-tests.json`, `docs/python-tests.xml`, `docs/evidence/frontend-tests.json`, `postgres-results.json`, `playwright-results.json`, `live-results.json`, `live-playwright-results.json`, `outage-results.json`, `backup-restore.json` and container logs.
''')
brief=(root/'docs/original-assessment-extracted.txt').read_text(encoding='utf-8')
sections=['# Assessment traceability\n\n'+f'Audited against all 12 pages of project3.pdf. Updated {stamp}. No evaluation score is assigned.\n\n'+table]
for i,(name,status,sources,endpoints,tests,summary) in enumerate(items,1):
 match=re.search(r'Assessment '+f'{i:02}'+r'.*?Objective:\s*(.*?)Learner implementation checklist',brief,re.S)
 requirement=' '.join(match.group(1).split()) if match else name
 detail=f'''## Assessment {i:02} — {name}

**Original PDF objective:** {requirement}

**Status:** {status}

**Implementation and limitations:** {summary}

**Source files:** `{sources}`.

**Endpoints / scope:** {endpoints}.

**Tests and evidence:** {tests}. Actual execution results are in TEST_REPORT.md, with machine-readable records in docs/evidence. Deployment and review limitations are not treated as passed tests.
'''
 sections.append(detail);write(f'docs/assessments/assessment-{i:02}.md',detail)
write('ASSESSMENT_CHECKLIST.md','\n\n'.join(sections))
write('KNOWN_LIMITATIONS.md','''# Known limitations

- The complete synthetic demo is live on three free Render services. It shares existing datastore compute with other projects, while using a separate database/login and Redis logical database/queue. Shared compute is an availability boundary, not a production isolation guarantee. No paid resources were purchased.
- GitHub returned HTTP 403 for private-repository branch protection on this account. No peer review/approval is claimed. CODEOWNERS names the real repository owner, not fictional teams.
- FHIR is a documented local R4-shaped mock. EMAIL/SMS are explicit local delivery simulators backed by PostgreSQL/Redis. There is no verified SMTP, external SMS, real payment or insurance integration.
- The active persistence adapter preserves the original controllers by loading a request-scoped unit of work and serializing it with a PostgreSQL advisory lock. It is correct for this synthetic demonstration but is not a high-throughput hospital architecture. A larger system should use scoped SQL repositories and finer transaction locks; the database exclusion constraint remains essential.
- Rate-limit buckets are in process memory. Refresh sessions, business data, consent, audits and notification delivery are persisted in PostgreSQL. Multi-instance abuse controls need a shared rate limiter.
- Both the JWT access token and refresh token are held in browser tab storage. React escapes displayed text, but stronger XSS defenses and an HttpOnly session/BFF design should be evaluated before real-world use. Current bearer-only API calls do not use ambient authentication cookies.
- The Render role has no superuser, CREATEROLE, CREATEDB or BYPASSRLS privilege and owns only the MediCore database. It still runs migrations and business requests under one login; production should separate those roles. The temporary provisioner URL was removed after setup. Audit update/delete is blocked by a trigger, but infrastructure administrators can alter database policy.
- The final test report is evidence of the stated cases, not proof of exhaustive correctness or legal/medical/regulatory compliance. Screen readers, browsers other than Chromium, cloud disaster recovery, retention archival and production load are not verified.
- Windows setup defaults reference existing PostgreSQL/Redis tools on this computer. Other computers should use Docker or supply tool paths. Database and Redis ports are isolated from the other projects already running here.
- The existing free Render PostgreSQL instance expires on 25 December 2026 at 19:00 UTC. Only one free PostgreSQL instance and one free Key Value instance can be active per workspace. Free Key Value data can disappear on restart, free web services sleep after 15 idle minutes, and 750 monthly instance hours are shared by the workspace. The PostgreSQL outbox supports queue recovery; the worker pauses when its hosting web service sleeps. Cold starts and redeploys can briefly interrupt requests; retry after startup.
- Free Render does not provide a dedicated background worker or managed PostgreSQL backups. The free demo configuration runs the BullMQ consumer inside the API process. A paid worker/backup solution requires the user's approval; no purchase was made.
''')
write('SECURITY_REPORT.md','''# Security review

## Corrected issues

The original runtime stored data and locks in memory, exposed FHIR anonymously, accepted arbitrary CORS origins, issued refresh tokens without checking revocation, and treated logout as a frontend action. These defects were corrected. Runtime persistence now uses PostgreSQL transactions, a GiST `tstzrange` exclusion constraint, composite patient-association foreign keys, hashed full refresh tokens, session JTI checks, replay invalidation and server-side logout.

Clinical access is denied to administrators, receptionists and billing officers. Doctors need a patient relationship and active scoped consent; nurses need explicit active care assignments. Lab technicians receive assigned orders. Patients access their own records; preliminary lab values remain hidden until validation. Consent changes are patient-only. Billing/payment ownership is enforced independently of UI visibility.

Zod validates requests, SQL values are bound parameters, CORS uses exact origins, Helmet and frontend headers are enabled, request IDs are bounded, body sizes and dataset sizes are limited, and login/refresh requests are rate limited. HTTP logs omit query strings, payloads, tokens and clinical notes. Audit details omit free-text clinical input. Clinical reads, denials and workflow mutations generate audit records. An SQL trigger rejects audit update/delete.

## Evidence

See `security-regression.test.ts`, `workflow-regression.test.ts`, real PostgreSQL privacy/concurrency checks, Python failure tests and the incident evidence. The dependency audit and local-secret scan are machine-readable in docs/. The secret scan prints paths/reasons only and found no local secret values in submission files. The historical sample strings were demonstration placeholders; live local secrets were generated into ignored `.env` and excluded from Git/ZIP.

## Boundary and remaining work

Use synthetic records only. This is not a medical decision system or a compliance certification. EMAIL/SMS/FHIR/payment limitations, browser storage, in-process rate limiting, coarse transaction scope, infrastructure privileges and missing cloud controls are documented in KNOWN_LIMITATIONS.md. No generative AI API or real patient/payment integration was added.

Confirm that the cohort permits AI assistance. Codex assisted with this audit, implementation, testing and documentation. Nitin Sharma remains responsible for understanding and explaining the code, licenses and every submitted component, as required by page 12 of the assessment brief.
''')
incidents=[
('Unauthorized clinical record access','Call a different patient chart as the demo patient, and call a full chart as an administrator.','Unauthenticated FHIR routes and several role-only checks exposed records without a care relationship.','Central scope middleware enforces ownership, clinician/nurse assignment and scoped consent. FHIR collections and identifiers enforce the same policy.','Both requests return 403; an ACCESS_DENIED audit row is stored.','security-regression.test.ts; postgres-results.json; postgres-run.log','Keep resource-level authorization close to every collection and identifier handler; review access-control changes.'),
('Appointment conflict','Send two competing bookings for one provider/time. Also insert an overlapping appointment directly in SQL.','A process-local mutex protected only one in-memory API instance. Timestamp-without-time-zone conversion also shifted persisted slots.','PostgreSQL transactions, a transaction advisory lock and an independent GiST exclusion constraint on timestamptz ranges protect every writer.','Competing HTTP requests produce 201 and 409; direct SQL rejects overlap with SQLSTATE 23P01.','concurrency.test.ts; workflow-regression.test.ts; postgres-results.json','Keep the database constraint and timezone regression when changing scheduling; review migrations.'),
('Delayed notifications','Inject one controlled sandbox delivery failure; then stop the dedicated Redis instance while a message is pending.','The original worker kept an in-memory array and could lose or silently drop jobs.','BullMQ uses three retries with backoff; PostgreSQL stores a durable outbox and delivery ledger. Requeue the failed job through the controlled test recovery.','Three failures are recorded, controlled retry delivers once, and a message created during Redis outage is delivered after Redis restarts.','verify_outages.cjs; outage-results.json; outage-run.log','Monitor failures and delivery age. Use the durable outbox to repopulate Redis after data loss. Production needs a supervised worker.'),
('Database outage','Stop only this session-owned PostgreSQL cluster on 127.0.0.1:5546; request /ready and a business endpoint; restart it.','The initial readiness check only counted in-memory users and therefore could not detect a real database outage.','Readiness queries PostgreSQL; API operations fail closed with a safe 503. Pool reconnection and graceful startup are implemented.','Both endpoints return 503 during the outage; readiness returns 200 after restart and patient counts remain unchanged.','verify_outages.cjs; outage-results.json; outage-run.log; backup-restore.json','Alert on readiness failures, keep backups and prove isolated restores. Never switch silently to synthetic fallback data.'),
('Incorrect laboratory result association','Submit a result whose patient differs from the parent lab order, then try the equivalent direct SQL insert.','Some parent/child associations were checked only in controllers and could be bypassed outside the API.','The server rejects mismatches and PostgreSQL composite foreign keys bind lab result -> order -> encounter -> appointment to the same patient.','The API returns 400 PATIENT_MISMATCH; direct SQL rejects the association with SQLSTATE 23503; a correct result is entered, reviewed and released.','workflow.test.ts; postgres-results.json; postgres-run.log','Retain composite foreign keys and negative association tests; review every clinical schema change.')]
parts=['# Controlled incident simulations\n\nThese are real, controlled local tests using synthetic data, not production incidents. No unrelated database or Redis service was stopped. Error logs contain technical events and opaque request IDs, without secrets or clinical payloads.']
for i,(name,repro,cause,fix,recovery,evidence,prevention) in enumerate(incidents,1):
 text=f'# Simulation {i:02}: {name}\n\n**Reproduction:** {repro}\n\n**Root cause:** {cause}\n\n**Implemented correction:** {fix}\n\n**Recovery verification:** {recovery}\n\n**Regression/evidence:** `{evidence}` in docs/evidence and source tests.\n\n**Prevention:** {prevention}\n'
 parts.append(text);p=list((root/'docs/incidents').glob(f'incident-{i:02}-*.md'))[0];p.write_text(text,encoding='utf-8')
write('INCIDENT_REPORT.md','\n\n'.join(parts))
write('DEPLOYMENT_GUIDE.md',f'''# Deployment and recovery guide

## Actual status

Source repository: [{repo}]({repo}). The complete synthetic application is deployed and verified on Render:

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
Set-Location 'C:\\Users\\amits\\Downloads\\MediCore_Complete_Project'
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
''')
write('README.md',f'''# MediCore

Hospital, Appointment & Patient Care Management Platform · Developer: **Nitin Sharma** · Synthetic educational data only.

MediCore preserves the existing Next.js/Express/FastAPI application and now persists business records in PostgreSQL. It provides seven role workspaces, provider availability, booking, clinical care, laboratory review, billing, consent, audit history and operational analytics. Payments and outbound messages are simulations; FHIR is an authenticated local mock.

## Verified result

{total} final recorded checks: {passed} passed, {failed} failed, {skipped} skipped. See [TEST_REPORT.md](TEST_REPORT.md) for suite counts and coverage. [Live MediCore](https://medicore-nitinsharma.onrender.com) · [Express Swagger](https://medicore-api-nitinsharma.onrender.com/api-docs/) · [FastAPI Swagger](https://medicore-analytics-nitinsharma.onrender.com/docs) · [GitHub source]({repo}). The complete free Render demo uses private PostgreSQL/Redis and the embedded BullMQ worker. Cold starts can take about a minute; refresh after startup. The database expires 25 December 2026.

{table}

## Run on this Windows computer

Requirements: Node.js 22, Python 3.13, PostgreSQL and Redis executables. Existing local tools are reused by the setup script in a separate cluster; Docker is an alternative.

```powershell
Set-Location 'C:\\Users\\amits\\Downloads\\MediCore_Complete_Project'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-local.ps1
npm ci
py -3.13 -m pip install -r apps/analytics-service/requirements.txt
npm run build --workspace=packages/shared
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

- Frontend: http://localhost:3010
- REST API: http://localhost:4010/api/v1
- Express Swagger: http://localhost:4010/api-docs/
- FastAPI: http://localhost:8010 · Swagger: http://localhost:8010/docs
- Readiness: http://localhost:4010/ready

Use separate demo sessions for role testing. [All demo accounts](DEMO_ACCOUNTS.md) use the intentionally public synthetic password `Password123!`. Never use real patient data, real payments or infrastructure credentials in the demo.

## Architecture and persistence

Next.js uses React, TypeScript, Tailwind, TanStack Query and Framer Motion. Express owns business rules and data; FastAPI processes bounded synthetic datasets and calculates metrics from an authorized operational projection. PostgreSQL uses the `pg` query layer, versioned SQL migrations, constraints and a transaction-scoped compatibility adapter for the original controllers. Redis/BullMQ processes a PostgreSQL-backed notification outbox. [Architecture and ER diagrams](docs/architecture/).

Default runtime mode is PostgreSQL. Only isolated Jest fixtures explicitly use memory. No runtime fallback to memory or invented analytics exists. The original Prisma template is marked as an unused legacy reference; `database/schema.sql`, migrations and captured catalog are authoritative. The adapter's global transaction lock and full-state loading are documented scaling limits.

## Tests

```powershell
npm test --workspace=apps/backend -- --runInBand --silent --coverage
npm test --workspace=apps/frontend
npm run lint
npm run typecheck --workspace=apps/frontend
$env:PYTHONPATH='apps/analytics-service'
py -3.13 -m pytest apps/analytics-service/tests -q
node scripts/verify_postgres.cjs
npx playwright install chromium
npx playwright test
py -3.13 scripts/verify_backup.py
```

The outage script stops only the dedicated synthetic PostgreSQL/Redis instances after validating ports. It requires API worker polling to be disabled during its controlled queue-failure fixture. Use `scripts/verify_outages.cjs` only as described in INCIDENT_REPORT.md; do not run it against another deployment.

## Submission

[Assessment checklist](ASSESSMENT_CHECKLIST.md) · [Security](SECURITY_REPORT.md) · [Incidents](INCIDENT_REPORT.md) · [Deployment](DEPLOYMENT_GUIDE.md) · [Known limitations](KNOWN_LIMITATIONS.md) · [Loom script](LOOM_DEMO_SCRIPT.md) · [Technical review](TECHNICAL_REVIEW_GUIDE.md) · [API reference](docs/API_REFERENCE.md) · [Final delivery report](FINAL_DELIVERY_REPORT.md).

The final documentation PDF contains exactly 12 A4 pages. The final ZIP excludes actual environment files, credentials, dependencies, virtual environments, databases, caches and build output. Cohort policy must permit AI assistance; the learner remains responsible for correctness and explaining the code.

To regenerate the submission, use Python 3.13, install `scripts/requirements-docs.txt`, then run `scripts/generate_submission_docs.py`, `scripts/build_documentation_pdf.py` and `scripts/build_package.py`. Inspect every regenerated PDF page. The packager checks CRCs and performs a real extraction into ignored `.runtime`. The final package's `GIT_DELIVERY_STATUS.json` records the delivered branch, exact commit and remote push; its adjacent ZIP checksum is outside the archive.
''')
write('LOOM_DEMO_SCRIPT.md',f'''# MediCore demonstration script — 7 minutes 30 seconds

**0:00–0:35 — Introduction.** “Hello, I am Nitin Sharma. This is MediCore, a hospital appointment and patient care platform. All records are synthetic. Payments and outbound messages are simulations.”

**0:35–1:00 — Overview.** Show the landing page. Explain the seven roles, the appointment-to-care journey and why clinical privacy and scheduling conflicts matter.

**1:00–1:25 — Documentation.** Open the 12-page PDF, assessment checklist and actual test report. State which assessments are partial or blocked. Do not quote an evaluation score.

**1:25–2:10 — Application.** Open http://localhost:3010. Log in as the patient. Show actual appointments, released lab values, billing and consent. Book a future available slot. Explain the UTC timestamp and the provider's IANA time zone.

**2:10–3:35 — Care workflow.** Use the receptionist to check in the booked synthetic patient. The assigned doctor starts an encounter, records a clinician-entered diagnosis, prescription and lab order. An assigned technician enters a result. The doctor reviews and releases it. Billing creates an invoice; the patient makes a simulated payment. Show notification and audit history.

**3:35–4:20 — Roles and privacy.** Show nurse assignments and vitals, the lab workstation, billing and administrator analytics. Explain that administrators cannot open clinical charts. Demonstrate a denied cross-patient request and patient consent revocation. Do not display tokens or `.env`.

**4:20–5:10 — Backend/code.** Open routes, scope middleware and the PostgreSQL adapter. Explain server validation, token revocation, transactions and the independent exclusion constraint. A memory-only mutex would not protect multiple processes.

**5:10–5:45 — Python and database.** Open FastAPI Swagger. Explain operational metrics from authenticated database projections, no hardcoded fallback data and 503 on dependency failure. Show the ER diagram and composite patient associations.

**5:45–6:15 — GitHub.** Show {repo}, real commits, feature branch/pull request and actual Actions results. Branch protection was unavailable for the private repository on this account; no peer approval is claimed.

**6:15–6:50 — Deployment.** Open https://medicore-nitinsharma.onrender.com in a fresh session, show API readiness and analytics health, and explain the three free services, private datastore addresses and embedded worker. State the database's 25 December 2026 expiry, idle cold starts and missing managed backups. Show actual deployment evidence without revealing environment values.

**6:50–7:30 — Conclusion.** Show the real test counts and five controlled incident reports. Mention the local FHIR/mock delivery scope, scaling limits and remaining cloud/review work. Offer to trace a browser action through Express to PostgreSQL or make a small change during review.

Preparation: rehearse with separate browser sessions for each role and one fresh future appointment. Keep the test evidence visible. Never demonstrate real records, a real payment or fabricated deployment evidence.
''')
questions=[
('What problem does MediCore solve?','It coordinates synthetic hospital scheduling and patient-care records while keeping each role inside its permissions.'),
('What are the three application services?','Next.js serves the interface, Express owns business APIs and records, and FastAPI performs bounded data processing and operational analytics.'),
('Where is the source of truth?','PostgreSQL. Redis is a queue dependency, and frontend/FastAPI responses do not become separate authoritative patient databases.'),
('How does a browser call the backend?','Browser requests use /api/v1 on the frontend origin. Next.js rewrites them to the configured Express service; bearer tokens are forwarded.'),
('Why use pg instead of the old Prisma file?','The original runtime used arrays, not Prisma. The pg transaction adapter preserves existing controllers while adding real normalized persistence. SQL migrations and the captured catalog are authoritative.'),
('How does a request transaction work?','A PostgreSQL client begins a transaction, acquires an advisory lock, loads a request-scoped unit of work, executes the existing handlers, flushes changed rows and commits before sending success.'),
('What is the adapter trade-off?','It serializes requests and loads more data than necessary. This is acceptable for the synthetic demonstration but should become scoped SQL repositories for larger workloads.'),
('Why is the appointment exclusion constraint necessary?','Application checks can race or be bypassed. The GiST constraint rejects overlapping active time ranges for the same doctor, including direct SQL writers.'),
('What does a half-open time range mean?','The start is included and the end is excluded. A 09:00–09:30 slot can be followed by 09:30–10:00 without overlap.'),
('Why use timestamptz?','An appointment is an instant. Explicit offsets avoid driver/server timezone shifts. Provider clinic hours are converted using an IANA zone.'),
('How do you test concurrency?','Dispatch competing HTTP requests using separate application instances against PostgreSQL and check for one success and one 409. Also attempt overlapping SQL directly.'),
('What is authentication?','It establishes the user identity from a signed JWT and an active persisted session. A valid signature alone is insufficient after logout or revocation.'),
('What is authorization?','It decides whether that user may perform the action on the particular record. Role, ownership, care assignment and consent are checked on the server.'),
('How are passwords stored?','As bcrypt hashes. Demo passwords are intentionally public synthetic credentials; real local service secrets exist only in ignored environment configuration.'),
('How do refresh tokens rotate?','The full token is hashed in PostgreSQL. A valid refresh consumes the old session, issues a new pair, and replay of an old token revokes the user session family.'),
('What happens on logout?','The backend revokes the session associated with the access-token JTI. Both access and refresh use are rejected afterward; frontend state is also cleared.'),
('Can a patient supply another patient ID?','The API checks token-linked ownership and parent/child associations. Supplying an identifier does not grant access.'),
('Can an administrator read every clinical chart?','No. Administrator permissions cover operational analytics, staff, departments and audit review. Clinical charts require a patient or authorized care relationship.'),
('How is nurse access determined?','An active CareAssignment links the nurse user to the patient. Consent still applies. The nurse cannot issue a prescription as a doctor.'),
('How is consent enforced?','Staff clinical access requires current, unrevoked and unexpired consent, including any target role/user restriction. Only the patient changes consent.'),
('How are incorrect lab associations stopped?','The API checks the parent order/encounter patient, and composite foreign keys enforce the association again in PostgreSQL.'),
('When may a patient see lab values?','Only after an authorized doctor validates a result as FINAL with a validation timestamp. Preliminary results are filtered from patient responses.'),
('How are invoice values handled?','The API validates positive line items and calculates in cents. Payments are simulated, scoped to the invoice owner and cannot exceed the balance.'),
('How are audit logs protected?','Important access, denial and mutation events are persisted. The adapter forbids mutation and a PostgreSQL trigger rejects audit updates/deletes. Infrastructure owners remain privileged.'),
('How does FastAPI obtain data?','It forwards the administrator bearer token to an Express operational projection. The projection removes clinical identifiers and supplies the data needed for metrics.'),
('What happens if analytics cannot reach Express?','It returns a safe 503. It does not create representative patient/appointment samples or fill charts with invented numbers.'),
('How are missing datasets handled?','The processor checks required columns, identifiers, finite numbers, units, reference metadata and timestamps. Malformed rows are rejected or explicitly reported.'),
('What is the FHIR integration?','A clearly documented local R4-shaped mock exports Patient, Appointment, Encounter and Observation resources. Authentication and clinical scope still apply.'),
('How do notifications survive Redis loss?','PostgreSQL is a durable outbox. BullMQ jobs carry opaque IDs; delivery has a unique ledger. Pending messages can be re-enqueued after Redis restarts.'),
('Are email and SMS actually sent?','No external delivery is verified. The current adapters are explicit local simulators. Never describe them as production email/SMS providers.'),
('What does Docker Compose run?','Frontend, Express API, FastAPI, PostgreSQL, Redis and a separate background worker. Datastores have no published ports and app containers use non-root users.'),
('What does CI verify?','Builds, types/lint, unit/API/Python/browser checks, dependency audit, migrations, images and complete Compose health/security checks. Consult the actual Actions run rather than assuming a YAML file proves success.'),
('What prevents an unapproved release?','The release is manually dispatched and expects configured environments, reviewers and deploy-hook secrets. Those cloud approval/release settings are not verified in this session.'),
('How would you restore a backup?','Verify its checksum and restore to a separate disposable target first. Compare counts and constraints, take a pre-cutover backup, and approve the production cutover explicitly.'),
('What remains incomplete?','The synthetic Render demo is live and verified. Off-host cloud backups/retention, separate migration credentials, protected staging releases and actual peer review remain incomplete. Private branch protection was rejected by the account plan; free hosting has expiry and sleep limits.'),
('How can you make a safe small change during review?','Find the route and shared validation schema, update the service/controller, add a meaningful regression for the changed behavior, run affected checks and explain the database/permission impact.')]
write('TECHNICAL_REVIEW_GUIDE.md','# Technical review guide\n\nAnswers describe the actual implementation and its limits.\n\n'+'\n\n'.join(f'## {i}. {q}\n\n{a}' for i,(q,a) in enumerate(questions,1)))
write('FINAL_DELIVERY_REPORT.md',f'''# MediCore final delivery report

Updated {stamp}. Developer: Nitin Sharma. Source was improved in the existing workspace; it was not rebuilt from scratch.

## Review and implementation

The audit replaced the runtime's in-memory persistence with actual PostgreSQL, added migrations/association constraints and a real Redis/BullMQ worker, corrected refresh/logout/replay behavior, removed anonymous FHIR access and permissive CORS, enforced record-level consent/assignment boundaries and protected preliminary lab data. A real SQL test caught timezone drift and led to timestamptz storage. The UI gained responsive mobile navigation, working profile/invoice/availability/waiting-list tools, real notifications, reduced-motion support, clear role routing and actual analytics. Hardcoded charts and unsupported service-health claims were removed. Original Git history was preserved.

Important changes are under apps/backend/src/database, middlewares, controllers and routes; apps/frontend components/pages; analytics-service routers/processing; SQL migrations; Docker/Render/Actions configuration. Detailed decisions are in the security, assessment and deployment reports.

## All 15 assessments

{table}

No evaluation score is assigned. Partial/blocked assessments are not presented as completed production work.

## Tests and verification

{test_table}

Backend Jest line coverage: {coverage.get('lines',{}).get('pct','not recorded')}%; statement coverage: {coverage.get('statements',{}).get('pct','not recorded')}%. Frontend/Python coverage percentages were not measured. Shared/backend and frontend production builds, frontend type checking and ESLint passed. Docker images and the full Compose environment passed real GitHub CI. Latest captured CI state: {ci_status}; [evidence]({ci_url}). See TEST_REPORT.md for the exact boundaries, failure corrections and raw reports.

The actual PostgreSQL workflow, database-level overlap, consent/IDOR boundaries, five incident scenarios, Redis/database restart recovery and isolated backup restore were exercised. No real patient data or payments were used.

## Links

- Local frontend: http://localhost:3010
- Local Express API: http://localhost:4010/api/v1
- Express Swagger: http://localhost:4010/api-docs/
- FastAPI: http://localhost:8010 · Swagger: http://localhost:8010/docs
- GitHub: {repo}
- Render website: https://medicore-nitinsharma.onrender.com
- Production demo API: https://medicore-api-nitinsharma.onrender.com/api/v1 · Swagger: https://medicore-api-nitinsharma.onrender.com/api-docs/
- Render FastAPI: https://medicore-analytics-nitinsharma.onrender.com/health · Swagger: https://medicore-analytics-nitinsharma.onrender.com/docs

## Demo accounts

{demo}

## Deliverable paths

All files are in `C:\\Users\\amits\\Downloads\\MediCore_Complete_Project`:

- `MediCore_Project_Documentation.pdf` — exactly 12 A4 pages, with actual screenshots and diagrams.
- `MediCore_Final_Verified_Project.zip` — complete source/submission, with secrets/dependencies/caches/builds excluded.
- `ASSESSMENT_CHECKLIST.md`, `TEST_REPORT.md`, `DEPLOYMENT_GUIDE.md`, `SECURITY_REPORT.md`, `INCIDENT_REPORT.md`, `KNOWN_LIMITATIONS.md`.
- `LOOM_DEMO_SCRIPT.md`, `TECHNICAL_REVIEW_GUIDE.md` (36 questions/answers), `DEMO_ACCOUNTS.md`.
- OpenAPI/Postman, architecture diagrams, screenshots and raw evidence in their named directories.

## Remaining blockers

Render is deployed and live synthetic workflows are verified. Three free web services reuse private datastore compute with a separate MediCore database/login and Redis database 2. The temporary provisioner credential was removed. Remaining limits include the database's 25 December 2026 expiry, shared monthly hours, idle sleeps, embedded worker, missing off-host cloud backups/retention and a combined migration/runtime database owner. No paid resource was purchased. GitHub rejected private branch protection with HTTP 403, and no peer approval is claimed. Protected staging release hooks remain unconfigured. FHIR and outbound messages remain explicit local mocks/simulators; no external API key is required. Default onrender.com DNS and HTTPS are verified; no custom domain was requested or provisioned.

## Run again

```powershell
Set-Location 'C:\\Users\\amits\\Downloads\\MediCore_Complete_Project'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-local.ps1
npm ci
py -3.13 -m pip install -r apps/analytics-service/requirements.txt
npm run build --workspace=packages/shared
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

Do not overwrite the existing ignored `.env`. For Docker, another machine or Render, follow DEPLOYMENT_GUIDE.md.

## GitHub handoff

Original Git history was preserved. The audit was developed on `feature/verified-audit`, and [pull request 2]({repo}/pull/2) was merged into main without a fabricated peer approval. Subsequent commits implement and test the actual Render deployment. [Issue 1]({repo}/issues/1) tracks remaining review/production hardening. Latest captured source CI: `{ci.get('headSha','not captured')}`; [run]({ci_url}).

The final ZIP includes `GIT_DELIVERY_STATUS.json` with the delivered main commit and verified push status. `MediCore_Final_Verified_Project.zip.sha256` sits next to the archive. Live services' actual deployed revisions are recorded individually in `docs/evidence/render-deployment.json`; a documentation-only delivery commit does not require redeploying unchanged application code.
''')
write('docs/evidence/final-test-summary.json',json.dumps({'recorded_at':stamp,'suites':[{'name':n,'executed':t,'passed':p,'failed':f,'skipped':s} for n,t,p,f,s in counts],'total':total,'passed':passed,'failed':failed,'skipped':skipped,'backend_coverage':coverage,'ci_url':ci_url,'ci_status':ci_status},indent=2))
print(f'Generated submission reports: {total} checks, {passed} passed, {failed} failed; {len(questions)} review questions')

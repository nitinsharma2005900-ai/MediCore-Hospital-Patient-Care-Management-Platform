# MediCore

Hospital, Appointment & Patient Care Management Platform · Developer: **Nitin Sharma** · Synthetic educational data only.

MediCore preserves the existing Next.js/Express/FastAPI application and now persists business records in PostgreSQL. It provides seven role workspaces, provider availability, booking, clinical care, laboratory review, billing, consent, audit history and operational analytics. Payments and outbound messages are simulations; FHIR is an authenticated local mock.

## Verified result

267 final recorded checks: 267 passed, 0 failed, 0 skipped. See [TEST_REPORT.md](TEST_REPORT.md) for suite counts and coverage. [Live MediCore](https://medicore-nitinsharma.onrender.com) · [Express Swagger](https://medicore-api-nitinsharma.onrender.com/api-docs/) · [FastAPI Swagger](https://medicore-analytics-nitinsharma.onrender.com/docs) · [GitHub source](https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform). The complete free Render demo uses private PostgreSQL/Redis and the embedded BullMQ worker. Cold starts can take about a minute; refresh after startup. The database expires 25 December 2026.

| # | Assessment | Status |
|---|---|---|
| 01 | Healthcare role-based frontend | Completed and verified |
| 02 | Hospital backend APIs | Completed and verified |
| 03 | Clinical relational database | Completed and verified |
| 04 | Clinical data security | Completed and verified |
| 05 | Python clinical data processing | Completed and verified |
| 06 | FastAPI clinical analytics | Completed and verified |
| 07 | Appointment and care workflow engine | Completed and verified |
| 08 | Healthcare interoperability | Partially completed |
| 09 | Docker healthcare environment | Completed and verified |
| 10 | Git and clinical change review | Partially completed |
| 11 | Healthcare CI/CD | Partially completed |
| 12 | Privacy and workflow testing | Completed and verified |
| 13 | Healthcare API documentation | Completed and verified |
| 14 | Secure hospital deployment | Partially completed |
| 15 | Healthcare incident simulation | Completed and verified |

## Run on this Windows computer

Requirements: Node.js 22, Python 3.13, PostgreSQL and Redis executables. Existing local tools are reused by the setup script in a separate cluster; Docker is an alternative.

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

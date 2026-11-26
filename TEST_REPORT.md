# Actual test report

Recorded 26 November 2026, 11:56 IST. The table reports the latest complete recorded run of each suite, not every intermediate rerun during debugging.

| Suite | Executed | Passed | Failed | Skipped |
|---|---:|---:|---:|---:|
| Backend Jest / Supertest (isolated memory fixtures) | 45 | 45 | 0 | 0 |
| React Testing Library / Vitest | 3 | 3 | 0 | 0 |
| Python pytest / HTTPX | 23 | 23 | 0 | 0 |
| Real PostgreSQL integration checks | 39 | 39 | 0 | 0 |
| Playwright browser tests | 48 | 48 | 0 | 0 |
| Controlled outage / queue checks | 4 | 4 | 0 | 0 |
| Live Render API / workflow checks | 57 | 57 | 0 | 0 |
| Live Render Playwright browser tests | 48 | 48 | 0 | 0 |
| **Total final recorded checks** | **267** | **267** | **0** | **0** |

## Coverage and builds

Backend Jest statement coverage: **53.41%**; branch coverage: **36.21%**; function coverage: **36.8%**; line coverage: **56.97%**. This is instrumentation for the Jest run; PostgreSQL and browser checks are additional coverage of behavior, not added to these percentages. Frontend/Python coverage percentages were not measured.

The Next.js production build, shared/backend TypeScript builds, frontend type check and ESLint pass. Actual outputs are in `docs/evidence/`. npm audit reports zero known vulnerabilities in both the complete installed tree and production dependencies at the captured run. No future security guarantee is implied.

GitHub CI: **success**. [Captured run](https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform/actions/runs/45767540450). Three application Docker images and the six-service Compose environment were built and exercised in GitHub Actions. This computer has no Docker executable; local Docker execution was not performed.

## Verified boundaries

- Real PostgreSQL requests cover registration, role restriction, competing bookings, direct SQL exclusion, check-in, encounters, vitals, diagnoses, prescriptions, lab association, release, consent revocation, invoice/payment persistence, FHIR and FastAPI.
- Browser checks cover all seven roles at 360, 390, 768, 1024, 1440 and 1920 pixels; route protection, real appointment booking, landing pages and printable invoices. Separate Chromium runs cover localhost and the public Render app; cloud screenshots are in docs/screenshots/live.
- Outage checks actually stop and restart only the session-owned PostgreSQL cluster on port 5546 and Redis on 6386. They verify 503 responses, retained records, a durable notification outbox, three retries and controlled recovery.
- A real `pg_dump` archive was restored into a new disposable database. Row counts and critical constraints matched. The application database was not overwritten.

## Failures found and corrected

The initial project used memory despite claiming PostgreSQL verification. A direct SQL overlap test exposed timestamp conversion drift, corrected by the `timestamptz` migration. Browser checks exposed missing Tailwind utilities on Windows and overflowing patient tabs; both were fixed. The notification menu initially consumed the wrong API response shape; it now reads the actual envelope. Refresh replay/logout and unauthenticated FHIR access were corrected. Test fixture mistakes were corrected without removing or weakening security assertions.

No exhaustive test of every possible page state, assistive technology or production integration is claimed. Live synthetic checks cover HTTPS, seven roles, privacy, concurrent bookings, care, labs, billing, Redis delivery and authoritative FastAPI analytics. Initial live attempt failures and corrections are retained in docs/evidence/live-verification-notes.md. Full detailed results: `docs/backend-tests.json`, `docs/python-tests.xml`, `docs/evidence/frontend-tests.json`, `postgres-results.json`, `playwright-results.json`, `live-results.json`, `live-playwright-results.json`, `outage-results.json`, `backup-restore.json` and container logs.

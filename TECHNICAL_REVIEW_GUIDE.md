# Technical review guide

Answers describe the actual implementation and its limits.

## 1. What problem does MediCore solve?

It coordinates synthetic hospital scheduling and patient-care records while keeping each role inside its permissions.

## 2. What are the three application services?

Next.js serves the interface, Express owns business APIs and records, and FastAPI performs bounded data processing and operational analytics.

## 3. Where is the source of truth?

PostgreSQL. Redis is a queue dependency, and frontend/FastAPI responses do not become separate authoritative patient databases.

## 4. How does a browser call the backend?

Browser requests use /api/v1 on the frontend origin. Next.js rewrites them to the configured Express service; bearer tokens are forwarded.

## 5. Why use pg instead of the old Prisma file?

The original runtime used arrays, not Prisma. The pg transaction adapter preserves existing controllers while adding real normalized persistence. SQL migrations and the captured catalog are authoritative.

## 6. How does a request transaction work?

A PostgreSQL client begins a transaction, acquires an advisory lock, loads a request-scoped unit of work, executes the existing handlers, flushes changed rows and commits before sending success.

## 7. What is the adapter trade-off?

It serializes requests and loads more data than necessary. This is acceptable for the synthetic demonstration but should become scoped SQL repositories for larger workloads.

## 8. Why is the appointment exclusion constraint necessary?

Application checks can race or be bypassed. The GiST constraint rejects overlapping active time ranges for the same doctor, including direct SQL writers.

## 9. What does a half-open time range mean?

The start is included and the end is excluded. A 09:00–09:30 slot can be followed by 09:30–10:00 without overlap.

## 10. Why use timestamptz?

An appointment is an instant. Explicit offsets avoid driver/server timezone shifts. Provider clinic hours are converted using an IANA zone.

## 11. How do you test concurrency?

Dispatch competing HTTP requests using separate application instances against PostgreSQL and check for one success and one 409. Also attempt overlapping SQL directly.

## 12. What is authentication?

It establishes the user identity from a signed JWT and an active persisted session. A valid signature alone is insufficient after logout or revocation.

## 13. What is authorization?

It decides whether that user may perform the action on the particular record. Role, ownership, care assignment and consent are checked on the server.

## 14. How are passwords stored?

As bcrypt hashes. Demo passwords are intentionally public synthetic credentials; real local service secrets exist only in ignored environment configuration.

## 15. How do refresh tokens rotate?

The full token is hashed in PostgreSQL. A valid refresh consumes the old session, issues a new pair, and replay of an old token revokes the user session family.

## 16. What happens on logout?

The backend revokes the session associated with the access-token JTI. Both access and refresh use are rejected afterward; frontend state is also cleared.

## 17. Can a patient supply another patient ID?

The API checks token-linked ownership and parent/child associations. Supplying an identifier does not grant access.

## 18. Can an administrator read every clinical chart?

No. Administrator permissions cover operational analytics, staff, departments and audit review. Clinical charts require a patient or authorized care relationship.

## 19. How is nurse access determined?

An active CareAssignment links the nurse user to the patient. Consent still applies. The nurse cannot issue a prescription as a doctor.

## 20. How is consent enforced?

Staff clinical access requires current, unrevoked and unexpired consent, including any target role/user restriction. Only the patient changes consent.

## 21. How are incorrect lab associations stopped?

The API checks the parent order/encounter patient, and composite foreign keys enforce the association again in PostgreSQL.

## 22. When may a patient see lab values?

Only after an authorized doctor validates a result as FINAL with a validation timestamp. Preliminary results are filtered from patient responses.

## 23. How are invoice values handled?

The API validates positive line items and calculates in cents. Payments are simulated, scoped to the invoice owner and cannot exceed the balance.

## 24. How are audit logs protected?

Important access, denial and mutation events are persisted. The adapter forbids mutation and a PostgreSQL trigger rejects audit updates/deletes. Infrastructure owners remain privileged.

## 25. How does FastAPI obtain data?

It forwards the administrator bearer token to an Express operational projection. The projection removes clinical identifiers and supplies the data needed for metrics.

## 26. What happens if analytics cannot reach Express?

It returns a safe 503. It does not create representative patient/appointment samples or fill charts with invented numbers.

## 27. How are missing datasets handled?

The processor checks required columns, identifiers, finite numbers, units, reference metadata and timestamps. Malformed rows are rejected or explicitly reported.

## 28. What is the FHIR integration?

A clearly documented local R4-shaped mock exports Patient, Appointment, Encounter and Observation resources. Authentication and clinical scope still apply.

## 29. How do notifications survive Redis loss?

PostgreSQL is a durable outbox. BullMQ jobs carry opaque IDs; delivery has a unique ledger. Pending messages can be re-enqueued after Redis restarts.

## 30. Are email and SMS actually sent?

No external delivery is verified. The current adapters are explicit local simulators. Never describe them as production email/SMS providers.

## 31. What does Docker Compose run?

Frontend, Express API, FastAPI, PostgreSQL, Redis and a separate background worker. Datastores have no published ports and app containers use non-root users.

## 32. What does CI verify?

Builds, types/lint, unit/API/Python/browser checks, dependency audit, migrations, images and complete Compose health/security checks. Consult the actual Actions run rather than assuming a YAML file proves success.

## 33. What prevents an unapproved release?

The release is manually dispatched and expects configured environments, reviewers and deploy-hook secrets. Those cloud approval/release settings are not verified in this session.

## 34. How would you restore a backup?

Verify its checksum and restore to a separate disposable target first. Compare counts and constraints, take a pre-cutover backup, and approve the production cutover explicitly.

## 35. What remains blocked?

Render account access, live HTTPS deployment/production verification, cloud backup/retention and actual peer review. Private branch protection was rejected by the account plan.

## 36. How can you make a safe small change during review?

Find the route and shared validation schema, update the service/controller, add a meaningful regression for the changed behavior, run affected checks and explain the database/permission impact.

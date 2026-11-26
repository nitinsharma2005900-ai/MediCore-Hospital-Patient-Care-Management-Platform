# Security review

## Corrected issues

The original runtime stored data and locks in memory, exposed FHIR anonymously, accepted arbitrary CORS origins, issued refresh tokens without checking revocation, and treated logout as a frontend action. These defects were corrected. Runtime persistence now uses PostgreSQL transactions, a GiST `tstzrange` exclusion constraint, composite patient-association foreign keys, hashed full refresh tokens, session JTI checks, replay invalidation and server-side logout.

Clinical access is denied to administrators, receptionists and billing officers. Doctors need a patient relationship and active scoped consent; nurses need explicit active care assignments. Lab technicians receive assigned orders. Patients access their own records; preliminary lab values remain hidden until validation. Consent changes are patient-only. Billing/payment ownership is enforced independently of UI visibility.

Zod validates requests, SQL values are bound parameters, CORS uses exact origins, Helmet and frontend headers are enabled, request IDs are bounded, body sizes and dataset sizes are limited, and login/refresh requests are rate limited. HTTP logs omit query strings, payloads, tokens and clinical notes. Audit details omit free-text clinical input. Clinical reads, denials and workflow mutations generate audit records. An SQL trigger rejects audit update/delete.

## Evidence

See `security-regression.test.ts`, `workflow-regression.test.ts`, real PostgreSQL privacy/concurrency checks, Python failure tests and the incident evidence. The dependency audit and local-secret scan are machine-readable in docs/. The secret scan prints paths/reasons only and found no local secret values in submission files. The historical sample strings were demonstration placeholders; live local secrets were generated into ignored `.env` and excluded from Git/ZIP.

## Boundary and remaining work

Use synthetic records only. This is not a medical decision system or a compliance certification. EMAIL/SMS/FHIR/payment limitations, browser storage, in-process rate limiting, coarse transaction scope, infrastructure privileges and missing cloud controls are documented in KNOWN_LIMITATIONS.md. No generative AI API or real patient/payment integration was added.

Confirm that the cohort permits AI assistance. Codex assisted with this audit, implementation, testing and documentation. Nitin Sharma remains responsible for understanding and explaining the code, licenses and every submitted component, as required by page 12 of the assessment brief.

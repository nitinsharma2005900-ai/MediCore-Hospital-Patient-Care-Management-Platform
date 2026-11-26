## Assessment 03 — Clinical relational database

**Original PDF objective:** Model patients, providers, departments, appointments, encounters, diagnoses, medication orders, lab orders/results, invoices, consents, and audit records with clear relationships.

**Status:** Completed and verified

**Implementation and limitations:** 24 tables including migration metadata; 51 foreign keys. pg is the active query layer; the Prisma file is a legacy reference.

**Source files:** `database/migrations; database/schema.sql; src/database/postgres.ts`.

**Endpoints / scope:** All persistent business API operations.

**Tests and evidence:** PostgreSQL integration; schema-evidence.json; backup-restore.json. Actual execution results are in TEST_REPORT.md, with machine-readable records in docs/evidence. Deployment and review limitations are not treated as passed tests.

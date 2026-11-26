# Architecture artifacts

- `system-architecture.svg`: actual application/service boundaries.
- `core-er-diagram.svg`: selected core database relationships, also shown on page 4 of the PDF.
- `er-diagram.md`: the complete catalog-derived relationship diagram and constraints.
- `service-data-flow.svg`: registration-to-care/billing flow.
- `../../database/schema.sql`: actual schema-only PostgreSQL export, without patient data or credentials.
- `../evidence/schema-evidence.json`: captured tables, columns and 51 foreign-key definitions.

Express owns business data. FastAPI reads an authorized operational projection and does not keep a second authoritative patient database. Redis schedules jobs; PostgreSQL stores the durable outbox and unique delivery ledger. Docker runs a separate worker; the free Render demo configuration uses the same worker inside the API process.

The original array-based controllers execute inside a PostgreSQL transaction-scoped compatibility adapter. Its coarse lock and full-state loading are documented scaling limits. The active query layer is `pg`; the marked Prisma template is not the runtime schema.

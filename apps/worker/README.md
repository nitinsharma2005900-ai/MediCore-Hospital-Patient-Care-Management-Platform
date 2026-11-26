# Background worker
The maintained BullMQ implementation is `apps/backend/src/jobs/notifications.ts`.
Run `npm run worker --workspace=apps/backend` after migrations. Docker Compose starts a separate worker.
Render free demo mode starts the same worker inside the API process (`RUN_WORKER=true`).
PostgreSQL notifications form a durable outbox. EMAIL/SMS are explicitly local simulators.

# Incident Simulation 03: Delayed Notifications and Asynchronous Queue Congestion
**Assessment 15: Healthcare Incident Simulation**

## 1. Incident Description
Patients reported that appointment confirmation SMS and email notifications were arriving up to 45 minutes late following booking, causing confusion regarding scheduled consultation times.

## 2. Reproduction Steps
1. Simulate high-traffic batch ingestion of 500 appointment bookings within 60 seconds.
2. In legacy implementation without queues, notifications were invoked synchronously in the HTTP request loop.
3. Third-party SMS/SMTP latency spikes caused request thread starvation and cascaded timeouts.

## 3. Relevant Log Evidence
```text
[2026-11-24T11:15:02.301Z] WARN [worker-pool]: Queue backlog exceeded threshold: 420 pending jobs.
[2026-11-24T11:15:05.112Z] ERROR [smtp-transport]: Connection timeout to mail gateway (duration: 5002ms).
[2026-11-24T11:15:05.115Z] INFO [worker-retry]: Enqueuing job JOB-8821 for exponential backoff retry (Attempt 1/3).
```

## 4. Root Cause Analysis (RCA)
Coupling third-party notification delivery directly to the synchronous appointment booking API response caused severe performance degradation when third-party gateways experienced network latency or rate limits.

## 5. Implemented Fix
1. Decoupled notification generation from the primary HTTP transaction using Redis & BullMQ asynchronous background workers (`apps/worker/worker.ts`).
2. Added idempotency keys (`REMINDER-<appointmentId>`) to prevent duplicate email or SMS delivery upon worker retries.
3. Implemented local sandbox fallback (`NotificationSandboxService`) ensuring zero blocking on external networks during development.

## 6. Regression Test
Unit and integration test verifying that booking returns HTTP 201 in under 50ms while worker dequeues and dispatches asynchronously with idempotency deduplication.

## 7. Prevention Strategy
- Healthchecks and queue depth metrics exposed on Admin dashboard.
- Dead letter queue (DLQ) for notifications that fail 3 consecutive attempts.
- Rate limiter on external provider dispatch.

## 8. Recovery Evidence
Queue drained 500 jobs in 8.2 seconds without dropping any notification. Zero duplicates sent.

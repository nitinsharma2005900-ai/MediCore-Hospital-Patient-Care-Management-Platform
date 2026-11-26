# Incident Simulation 04: Primary Database Outage & Health Check Recovery
**Assessment 15: Healthcare Incident Simulation**

## 1. Incident Description
The primary PostgreSQL container experienced a sudden network interface disconnect, rendering the database inaccessible for 90 seconds. The hospital platform needed to detect the failure instantly, fail readiness checks gracefully, and automatically re-establish connections upon recovery without leaking stack traces.

## 2. Reproduction Steps
1. Stop the PostgreSQL instance: `docker stop medicore_postgres` or terminate active connection pool.
2. Query `/ready` and `/health` diagnostic endpoints.
3. Submit an API request to `/api/v1/patients`.
4. Restore the database: `docker start medicore_postgres`.
5. Observe automated reconnection and health status return to HTTP 200.

## 3. Relevant Log Evidence
```text
[2026-11-24T16:04:10.012Z] ERROR [db-pool]: PostgreSQL connection pool timeout: ECONNREFUSED.
[2026-11-24T16:04:10.020Z] WARN [health-check]: Readiness probe failed. Marking service unready (HTTP 503).
[2026-11-24T16:04:12.441Z] ERROR [req-id: req-err-9912]: Database query failed. Returning sanitized 500 without stack trace.
[2026-11-24T16:05:40.119Z] INFO [db-pool]: Database connection re-established. Pool restored with 10 connections.
[2026-11-24T16:05:40.125Z] INFO [health-check]: Readiness probe succeeded. Service marked ready (HTTP 200).
```

## 4. Root Cause Analysis (RCA)
Unmitigated database drops can lead to hung HTTP sockets and unhandled promise rejections that crash Node.js process clusters and leak internal database connection strings in stack traces.

## 5. Implemented Fix
1. Centralized `errorHandler` middleware catches database connection errors and sanitizes response to:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected internal error occurred. Please contact hospital support."
  }
}
```
2. Implemented active `/health` and `/ready` probes allowing reverse proxies (Nginx / Render / Kubernetes) to withhold traffic during transient database restarts.
3. Configured PostgreSQL connection pool with auto-reconnect and health checks.

## 6. Regression Test
Automated health test in test suite verifies that `/health` returns 200, and `/ready` accurately reflects database status.

## 7. Prevention Strategy
- Automated container restarts (`restart: unless-stopped`) in Docker Compose.
- Automated daily pg_dump backups and point-in-time restore scripts.
- Circuit breaker pattern on database queries.

## 8. Recovery Evidence
Database reconnected within 1.2 seconds of service restart. Zero manual intervention required; zero data corruption detected.

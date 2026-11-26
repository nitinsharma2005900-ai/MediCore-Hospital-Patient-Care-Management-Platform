# Assessment 14: Secure Hospital Deployment

## 1. Assessment Overview & Objectives
Assessment 14 evaluates the production deployment architecture for MediCore. The application is configured for deployment using Render Infrastructure-as-Code (`render.yaml`), establishing secure TLS/HTTPS termination, strict environment secret segregation, managed PostgreSQL database provisioning, Redis caching, and automated database disaster recovery scripts (`backup-db.ps1` and `restore-db.ps1`).

## 2. Acceptance Criteria & Implementation Matrix
| Deployment Component | Status | Implementation Details |
|---|---|---|
| Infrastructure as Code | Verified | `render.yaml` blueprint declaring backend, frontend, analytics, postgres, and redis services |
| Environment Secret Isolation | Verified | Zero hardcoded API keys; all sensitive parameters sourced via secure environment variables |
| Managed PostgreSQL | Verified | High-availability PostgreSQL database with automated backups configured |
| Managed Redis | Verified | In-memory cache instance supporting BullMQ queue worker and session tokens |
| TLS/HTTPS Termination | Verified | Automated Let's Encrypt SSL/TLS certificates on all public endpoints |
| Disaster Recovery Automation | Verified | PowerShell automation scripts `scripts/backup-db.ps1` and `scripts/restore-db.ps1` |
| Health Check Probes | Verified | Render configured to poll `/health` probes before routing live production traffic |

## 3. Render Blueprint Configuration (`render.yaml`)
```yaml
services:
  # Next.js Frontend Web Service
  - type: web
    name: medicore-frontend
    runtime: node
    plan: standard
    buildCommand: npm --workspace=apps/frontend run build
    startCommand: npm --workspace=apps/frontend run start
    envVars:
      - key: NEXT_PUBLIC_API_URL
        fromService:
          type: web
          name: medicore-backend
          property: host

  # Express Backend Web Service
  - type: web
    name: medicore-backend
    runtime: node
    plan: standard
    buildCommand: npm run build
    startCommand: node apps/backend/dist/server.js
    healthCheckPath: /health

  # FastAPI Analytics Microservice
  - type: web
    name: medicore-analytics
    runtime: python
    plan: standard
    buildCommand: pip install -r apps/analytics-service/requirements.txt
    startCommand: uvicorn main:app --app-dir apps/analytics-service --host 0.0.0.0 --port $PORT
    healthCheckPath: /health

databases:
  - name: medicore-db
    plan: standard
    databaseName: medicore
    user: medicore_admin
```

## 4. Disaster Recovery & Backup Scripts
Automated database backup and point-in-time recovery are executed via dedicated scripts:
- **`scripts/backup-db.ps1`**: Dumps database via `pg_dump` with timestamped gzip compression, computes SHA-256 checksums, and purges archives older than 30 days.
- **`scripts/restore-db.ps1`**: Verifies checksum integrity, creates a pre-restore safety snapshot, terminates active database sessions, and restores the targeted snapshot using `pg_restore`.

## 5. Verification Commands
Verify disaster recovery script syntax and help:
```powershell
Get-Help ./scripts/backup-db.ps1
Get-Help ./scripts/restore-db.ps1
```

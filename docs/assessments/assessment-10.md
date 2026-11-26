# Assessment 10: Git & Clinical Change Review

## 1. Assessment Overview & Objectives
Assessment 10 evaluates software engineering governance, change management, and security review processes for healthcare software. It establishes Git workflows, pull request conventions, automated code ownership, clinical database migration checklists, and patient privacy audit procedures to prevent unauthorized data exposure during development.

## 2. Acceptance Criteria & Implementation Matrix
| Governance Artifact | Status | File Location & Implementation Details |
|---|---|---|
| Pull Request Template | Verified | `.github/pull_request_template.md` enforcing clinical risk assessment and privacy review |
| Bug & Feature Templates | Verified | `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md` |
| Code Ownership Rules | Verified | `.github/CODEOWNERS` requiring clinical lead and security engineer review on sensitive paths |
| Migration Review Checklist | Verified | `docs/architecture/migration_review_checklist.md` for zero-downtime schema evolution |
| Access Control Checklist | Verified | `docs/architecture/access_control_review_checklist.md` for RBAC / anti-IDOR audits |
| Branch Protection Guide | Verified | `docs/architecture/branch_protection_guide.md` specifying required approvals and status checks |
| Structured Git Commits | Verified | Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `perf:`) |

## 3. Sensitive Path Governance (`CODEOWNERS`)
The CODEOWNERS configuration mandates domain-expert reviews before code can merge into `main`:
- `/database/prisma/schema.prisma` -> `@medicore/dba-leads`
- `/apps/backend/src/middleware/rbac.middleware.ts` -> `@medicore/security-leads`
- `/apps/backend/src/middleware/record-auth.middleware.ts` -> `@medicore/privacy-leads`
- `/apps/analytics-service/processing/` -> `@medicore/clinical-informatics`

## 4. Clinical Change Review Gates
Every proposed pull request must satisfy four mandatory criteria:
1. **PHI & Privacy Gate**: Confirms zero exposure of unmasked identifiers or clinical notes in logs or frontend props.
2. **Concurrency Safety Gate**: Confirms transaction boundaries protect critical resources (e.g. appointment slots).
3. **Database Migration Safety**: Confirms columns are added with nullable defaults; no locks held on high-traffic tables.
4. **Test Suite Coverage**: 100% pass rate across privacy, auth, workflow, and concurrency integration tests.

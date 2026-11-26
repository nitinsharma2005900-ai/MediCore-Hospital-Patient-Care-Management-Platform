# Git Branch Protection & Clinical Review Configuration
**Assessment 10: Git and Clinical Change Review**

To ensure regulatory compliance and code stability for the hospital platform, strict branch protection rules must be configured in GitHub repository settings:

## 1. Protected Branch: `main`
- **Require a pull request before merging**: Enabled
  - Require at least 2 peer reviews before merge
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from Code Owners (`.github/CODEOWNERS`)
- **Require status checks to pass before merging**:
  - `Backend Jest Tests & Type Check` (Must be green)
  - `Python Analytics Pytest & Benchmarks` (Must be green)
  - `Next.js Frontend Production Build` (Must be green)
  - `Dependency Vulnerability Audit` (No critical or high severity vulnerabilities)
- **Require linear history**: Enabled (Squash and merge or rebase merge)
- **Do not allow bypassing the above settings**: Enabled for all users, including repository administrators.

## 2. Feature Branch Naming Convention
- `feature/assessment-XX-description` (e.g., `feature/assessment-07-concurrency-engine`)
- `fix/incident-XX-description` (e.g., `fix/incident-02-appointment-conflict`)
- `chore/ci-docker-hardening`

# Clinical Database Migration Review Checklist
**Assessment 10: Git and Clinical Change Review**

Every schema alteration affecting patient data, encounters, orders, or billing tables must satisfy this checklist prior to merge:

## 1. Safety & Backward Compatibility
- [ ] **Zero Downtime**: Changes must be non-destructive. Columns cannot be dropped or renamed in a single deployment.
- [ ] **Default Values & Nullability**: New columns added to existing tables must either be `NULL` or provide safe default values so existing queries do not fail.
- [ ] **Locking & Performance**: Index creation on high-volume tables (`Appointment`, `AuditLog`, `LabResult`) must use concurrent indexing or non-blocking locks.
- [ ] **Transaction Boundaries**: Migration script must be wrapped in an atomic transaction (`BEGIN` / `COMMIT`) so failures trigger complete rollback.

## 2. Integrity & Relationships
- [ ] **Foreign Keys**: Foreign keys must have appropriate `ON DELETE` rules (`CASCADE` for child collections, `RESTRICT` for authoritative patient profiles).
- [ ] **Unique Constraints**: Compound uniqueness rules (such as `(doctorId, scheduledStartTime)`) must be validated against existing data to prevent collisions.
- [ ] **Audit Trail Alignment**: Additions to clinical entities must trigger corresponding records in `AuditLog`.

## 3. Review Sign-Off
- **Database Architect Approval**: Mandatory
- **Security Engineer Approval**: Required if permissions or user schemas change
- **Regression Tests Attached**: Verified on staging database

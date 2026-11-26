# MediCore - Clinical Relational Database Entity-Relationship (ER) Architecture
**Assessment 03: Clinical Relational Database**

The MediCore PostgreSQL database enforces 3NF relational normalization, foreign key constraints, cascade triggers, optimistic locking, and compound unique indexes to guarantee clinical data integrity and prevent race conditions.

```mermaid
erDiagram
    User ||--o| PatientProfile : "has profile"
    User ||--o| DoctorProfile : "has clinical profile"
    User ||--o{ RefreshToken : "owns sessions"
    User ||--o{ AuditLog : "initiates"
    User ||--o{ Notification : "receives"

    Department ||--o{ DoctorProfile : "employs"
    Department ||--o{ Appointment : "hosts"

    DoctorProfile ||--o{ DoctorAvailability : "defines schedule"
    DoctorProfile ||--o{ Appointment : "consults"
    DoctorProfile ||--o{ Encounter : "attends"
    DoctorProfile ||--o{ Prescription : "orders Rx"
    DoctorProfile ||--o{ LabOrder : "orders labs"

    PatientProfile ||--o{ Appointment : "books"
    PatientProfile ||--o{ Encounter : "visits"
    PatientProfile ||--o{ VitalSigns : "vital logs"
    PatientProfile ||--o{ Diagnosis : "diagnoses"
    PatientProfile ||--o{ Prescription : "prescribed"
    PatientProfile ||--o{ LabOrder : "lab specimens"
    PatientProfile ||--o{ LabResult : "test results"
    PatientProfile ||--o{ Invoice : "billed"
    PatientProfile ||--o{ ConsentRecord : "authorizes"

    Appointment ||--o| Encounter : "originates"
    Encounter ||--o{ VitalSigns : "captures"
    Encounter ||--o{ Diagnosis : "records"
    Encounter ||--o{ Prescription : "issues"
    Encounter ||--o{ LabOrder : "requisitions"
    Encounter ||--o| Invoice : "generates bill"

    Prescription ||--|{ PrescriptionItem : "contains line items"
    LabOrder ||--|{ LabResult : "produces results"
    Invoice ||--|{ InvoiceItem : "contains fee items"
    Invoice ||--o{ Payment : "settled by"
```

## Concurrency and Integrity Safeguards
1. **Double-Booking Prevention**: Database-level compound index on `(doctorId, scheduledStartTime)` paired with serializable transaction locks during slot allocation.
2. **Medical Record Number (MRN)**: System-generated unique identifier format `MRN-YYYY-XXXX` indexed for fast clinical lookups.
3. **Session Revocation**: Stored refresh token hashes with `revoked` and `revokedAt` timestamps enabling immediate global revocation upon logout or credential reset.
4. **Consent-Aware Enforcing**: Every sensitive patient retrieval checks against `ConsentRecord` table for matching patient authorization.
5. **Immutable Audit Trail**: Append-only `AuditLog` table capturing action type, user ID, role, resource entity, request correlation ID, and IP address.

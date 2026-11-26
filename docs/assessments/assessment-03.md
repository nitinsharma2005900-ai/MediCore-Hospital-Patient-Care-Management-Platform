# Assessment 03: Clinical Relational Database

## 1. Assessment Overview & Objectives
Assessment 03 evaluates the clinical relational database design for MediCore. The architecture uses PostgreSQL with Prisma ORM, enforcing 3NF normalization, relational integrity, foreign key cascades, unique constraints, and high-performance indexes. An idempotent SQL migration script and realistic synthetic data generator populate the database.

## 2. Acceptance Criteria & Implementation Matrix
| Requirement | Status | Implementation Details |
|---|---|---|
| PostgreSQL Relational Schema | Verified | 21 relational models defined in `database/prisma/schema.prisma` |
| 3NF Normalization | Verified | Zero data duplication; separate models for Users, Profiles, Appointments, Encounters, Diagnoses, Prescriptions, Vitals, Labs, Invoices |
| Foreign Keys & Constraints | Verified | Explicit `ON DELETE RESTRICT/CASCADE` constraints preventing orphan clinical records |
| Concurrency Unique Constraints | Verified | Unique compound index on `(doctorId, scheduledAt)` preventing overlapping appointments |
| Idempotent DDL Migration | Verified | `database/migrations/20261126000000_init/migration.sql` creates all tables, types, and indexes |
| Synthetic Seed Generator | Verified | `apps/backend/src/database/seed.ts` generates 10 departments, 15 doctors, 100 patients, 150 appointments, 40 encounters, 50 prescriptions, 60 lab orders, 50 invoices, and 7 demo accounts |
| Entity-Relationship Diagram | Verified | Complete Mermaid ER diagram documented in `docs/architecture/er-diagram.md` |

## 3. Database Schema Entities
The schema encompasses 21 core entities:
1. `User`: Core authentication entity (email, password hash, role, active status).
2. `RefreshToken`: Token rotation storage with revocation tracking.
3. `PatientProfile`: Medical record number (MRN), DOB, blood type, emergency contacts.
4. `DoctorProfile`: License number, specialty, bio, consultation fee.
5. `Department`: Clinical departments (Cardiology, Neurology, Pediatrics, etc.).
6. `DoctorSchedule`: Weekly recurring time slots with start/end hours.
7. `DoctorTimeOff`: Approved leave and blocked calendar intervals.
8. `Appointment`: Bookings with status (`SCHEDULED`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
9. `Encounter`: Doctor-patient consultation session with chief complaint and clinical notes.
10. `VitalSigns`: Temperature, heart rate, blood pressure, SpO2, respiratory rate, BMI.
11. `Diagnosis`: ICD-10 coded diagnostic findings entered by doctors.
12. `Prescription`: Medication instructions, refills, dispense status.
13. `PrescriptionItem`: Medication name, dosage, frequency, duration.
14. `LabOrder`: Laboratory requisition with LOINC codes and priority.
15. `LabResult`: Quantitative or qualitative laboratory findings with reference ranges.
16. `Invoice`: Financial billing record with subtotal, tax, discounts, and balance.
17. `InvoiceItem`: Itemized consultation, laboratory, or pharmacy charges.
18. `Payment`: Simulated payment transaction records.
19. `Consent`: Patient privacy directives for clinical record sharing.
20. `AuditLog`: Immutable access and modification tracking records.
21. `Notification`: In-app, email, and SMS simulated delivery logs.

## 4. Verification & Seed Output
The seed script runs seamlessly, creating relational records with referential integrity:
```bash
npx ts-node apps/backend/src/database/seed.ts
# Database seeded successfully:
# - 10 Departments
# - 15 Doctors with weekly schedules
# - 100 Synthetic Patients with profiles
# - 150 Appointments across past, today, and future dates
# - 40 Encounters with vitals and ICD-10 diagnoses
# - 50 Electronic Prescriptions with medication items
# - 60 Laboratory Orders with LOINC results
# - 50 Invoices with payment records
# - 7 Standard Demo Accounts (Password: Password123!)
```

# Assessment 07: Appointment and Care Workflow Engine

## 1. Assessment Overview & Objectives
Assessment 07 evaluates the core clinical workflow engine that governs the patient care lifecycle. The engine orchestrates doctor availability, appointment booking, rescheduling, cancellations, waiting lists, patient check-in, clinical encounters, vitals recording, ICD-10 diagnoses, electronic prescribing, and laboratory order fulfillment. A primary architectural requirement is database-level concurrency control to guarantee that simultaneous booking requests can never produce double-booked appointments.

## 2. Acceptance Criteria & Implementation Matrix
| Workflow Component | Status | Implementation Details |
|---|---|---|
| Doctor Availability Rules | Verified | Weekly schedules, appointment slot duration (30 min), break intervals, and approved leaves |
| Concurrency Protection | Verified | Transactional mutex queue in `runTransaction` + unique constraint on `(doctorId, scheduledAt)` |
| Double-Booking Prevention | Verified | Simultaneous requests tested; second booking fails with 409 Conflict |
| Patient Check-In Workflow | Verified | Receptionist updates appointment to `CHECKED_IN`, recording arrival timestamp for wait-time tracking |
| Clinical Encounter Lifecycle | Verified | Status progression: `SCHEDULED` -> `CHECKED_IN` -> `IN_PROGRESS` -> `COMPLETED` |
| Nursing Triage & Vitals | Verified | Vitals captured (temp, pulse, BP, SpO2, BMI) linked directly to active encounter |
| Electronic Prescribing | Verified | Medication dosage, frequency, duration, refills, and dispensing status validation |
| Laboratory Workflow | Verified | Order placed by Doctor -> Collected by Nurse -> Analyzed by Lab Tech -> Results Released |

## 3. Concurrency Protection Mechanism
To guarantee that two patients cannot book the same doctor at the same minute, MediCore implements dual-layer protection:
1. **Application-Level Mutex Queue (`apps/backend/src/database/store.ts`)**:
   All booking mutations execute within a serialized transactional runner (`runTransaction`). If two requests arrive concurrently, the second evaluates doctor availability only after the first commits.
2. **Database-Level Unique Compound Index (`database/prisma/schema.prisma`)**:
   ```prisma
   @@unique([doctorId, scheduledAt], name: "unique_doctor_schedule_slot")
   ```
   Any concurrent thread attempting an overlapping insert triggers a unique constraint violation and aborts with an HTTP `409 Conflict`.

## 4. Clinical State Machine
```
   [ Patient Books Slot ]
             │
             ▼
      ( SCHEDULED ) ───[ Patient/Receptionist Cancels ]───> ( CANCELLED )
             │
      [ Patient Arrives ]
             │
             ▼
     ( CHECKED_IN )
             │
      [ Doctor Begins Exam ]
             │
             ▼
     ( IN_PROGRESS ) ───[ Nurse Records Vitals ]
             │       ───[ Doctor Adds ICD-10 Diagnoses ]
             │       ───[ Doctor Writes Prescription ]
             │       ───[ Doctor Orders Lab Tests ]
             ▼
      ( COMPLETED ) ───> [ Billing Invoice Automatically Generated ]
```

## 5. Automated Concurrency & Workflow Tests
Automated tests prove that double bookings are impossible and state transitions are strictly governed:
```bash
npm --workspace=apps/backend run test -- concurrency.test.ts workflow.test.ts
# PASS apps/backend/src/tests/concurrency.test.ts
# ✓ Simultaneous booking requests for same doctor slot trigger 409 Conflict for second caller
# ✓ Multiple concurrent bookings for different doctors succeed without interference
#
# PASS apps/backend/src/tests/workflow.test.ts
# ✓ Appointment lifecycle transitions from SCHEDULED to CHECKED_IN to IN_PROGRESS to COMPLETED
# ✓ Cannot check in a cancelled appointment
# ✓ Cannot complete an encounter without doctor authorization
# ✓ Prescription items must have positive dosage and duration
```

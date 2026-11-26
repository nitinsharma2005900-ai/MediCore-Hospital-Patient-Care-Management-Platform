# MediCore – Video Walkthrough Script (Loom / Screen Recording)

**Target Duration:** 6 to 8 minutes  
**Presenter Role:** Senior Full-Stack Software Engineer & Clinical Architect  
**Platform Overview:** MediCore – Hospital, Appointment & Patient Care Management Platform  

---

## Segment 1: Introduction & Architecture Overview (0:00 – 1:15)
### Screen Display:
- Browser open at `http://localhost:3000` (MediCore Landing Page).
- Terminal split showing running services: Express backend on port 4001, FastAPI analytics on port 8001, and Next.js on port 3000.

### Verbal Script:
> "Hello everyone, and welcome to this demonstration of MediCore, an enterprise-grade hospital, appointment, and clinical patient care management platform.
>
> MediCore was engineered to address the mission-critical needs of modern healthcare organizations. It is built as a modular monorepo consisting of:
> 1. A Next.js App Router frontend with TypeScript, Tailwind CSS, Framer Motion, and Recharts.
> 2. An Express.js backend with full RBAC, record-level authorization, and anti-IDOR clinical controls.
> 3. A PostgreSQL database structured with 21 relational models and Prisma ORM.
> 4. A high-performance Python FastAPI microservice providing quantitative healthcare analytics and LOINC laboratory dataset validation.
>
> You'll notice our high-visibility Educational Disclaimer at the top of the screen: 100% of the patient profiles, lab findings, and financial transactions in this environment are synthetic. Let's explore the platform across all seven user roles."

---

## Segment 2: Patient Registration, Booking & Concurrency Protection (1:15 – 2:45)
### Screen Display:
- Navigate to `/login`.
- Click the **"Patient Demo"** quick-login button (`patient@medicore.health`).
- Shows the Patient Dashboard (`/dashboard/patient`).
- Click "Book New Appointment" -> `/appointments/book`.

### Verbal Script:
> "First, we sign in as a Patient. Notice our convenient 1-click demo persona switcher for evaluators.
>
> Here in the Patient Dashboard, patients can track their upcoming consultations, active prescriptions, released lab results, invoices, and privacy consent directives.
>
> Let's book a consultation with Dr. Sarah Jenkins in Cardiology for tomorrow at 09:00 AM.
>
> One of our critical requirements in Assessment 07 and Assessment 12 is preventing double bookings under high concurrent load. MediCore enforces this through a two-layer safeguard: an application-level transactional mutex queue paired with a database-level unique compound constraint on Doctor ID and Scheduled Timestamp.
>
> If two patients attempt to click 'Confirm Booking' at the exact same millisecond for the same doctor slot, the first transaction commits atomically while the second is safely rejected with an HTTP 409 Conflict error. Our automated Jest concurrency test suite rigorously validates this behavior."

---

## Segment 3: Receptionist Check-In & Nurse Triage (2:45 – 4:00)
### Screen Display:
- Switch user to **Receptionist** (`receptionist@medicore.health`).
- View `/dashboard/receptionist`.
- Click "Check In" on the scheduled appointment -> Status transitions to `CHECKED_IN`.
- Switch user to **Nurse** (`nurse@medicore.health`).
- View `/dashboard/nurse`. Click "Record Vitals". Enter Blood Pressure 120/80, Pulse 72, Temp 98.6°F, SpO2 99%, Height 175cm, Weight 70kg -> auto-calculates BMI 22.9.

### Verbal Script:
> "Now, our patient arrives at the clinic. The receptionist sees them in the Arrived Queue and clicks 'Check In'. This immediately timestamps the arrival, which our analytics service tracks to calculate hospital wait times.
>
> Next, the Nurse calls the patient into triage. Switching to the Nurse Dashboard, the nurse accesses the check-in queue and records vital signs: blood pressure, heart rate, temperature, oxygen saturation, and body measurements. Notice that the BMI is automatically computed and validated against biological ranges. These vitals attach immutably to the clinical encounter."

---

## Segment 4: Doctor Consultation, ICD-10 Diagnoses, e-Prescriptions & Lab Orders (4:00 – 5:30)
### Screen Display:
- Switch user to **Doctor** (`doctor@medicore.health`).
- View `/dashboard/doctor`. Click "Start Consultation".
- Enter clinical notes: 'Patient presents with mild chest discomfort upon exertion. Normal resting vitals.'
- Add ICD-10 Diagnosis: `I10 - Essential (primary) hypertension`.
- Write e-Prescription: `Lisinopril 10mg Oral Tablet, 1 tablet daily, 30 days, 2 refills`.
- Order Diagnostic Lab: Select LOINC `2345-7 (Fasting Glucose)` and `2085-9 (Lipid Panel)`.
- Click "Complete Encounter".

### Verbal Script:
> "Now Dr. Jenkins begins the consultation. In the Doctor Dashboard, the physician reviews the nurse's recorded vitals, documents clinical notes, and adds an official ICD-10 diagnosis.
>
> Dr. Jenkins then generates an electronic prescription with strict dosage and refill boundary validations, preventing accidental pediatric or geriatric dosage overflows.
>
> Finally, she places a laboratory requisition with standardized LOINC codes for a lipid profile and fasting blood glucose. When she clicks 'Complete Encounter', the care engine orchestrates two downstream events: the lab requisition enters the laboratory queue, and the billing department receives an automated notification to generate an itemized invoice."

---

## Segment 5: Laboratory Technician & Billing Officer Workflows (5:30 – 6:45)
### Screen Display:
- Switch user to **Lab Technician** (`labtech@medicore.health`).
- View `/dashboard/lab`. Locate the pending requisition. Enter Glucose value: `94 mg/dL` (Normal: 70–99). Click "Validate & Release Results".
- Switch user to **Billing Officer** (`billing@medicore.health`).
- View `/dashboard/billing`. Open invoice. Shows Consultation Fee ($150) + Lab Fee ($45) = Total $195. Click "Record Simulated Payment".

### Verbal Script:
> "Switching to our Laboratory Technician persona, the technician sees the pending blood work. The technician inputs the test findings. MediCore validates the numbers against reference ranges. Once verified, the technician releases the result. It is instantly visible in the patient's personal portal and converted to HL7 FHIR R4 Observation format for health information exchanges.
>
> Next, our Billing Officer accesses the Billing Dashboard. MediCore enforces strict privacy segregation: the billing officer sees only itemized financial codes and consultation fees, with zero clinical diagnoses or physician notes exposed. The billing officer records a simulated payment, marking the invoice settled."

---

## Segment 6: Administrator Dashboard, FastAPI Analytics & Conclusion (6:45 – 8:00)
### Screen Display:
- Switch user to **Hospital Administrator** (`admin@medicore.health`).
- View `/dashboard/admin`.
- Highlight live Recharts:
  - Appointment Utilization by Department (Cardiology 84%, Pediatrics 88%).
  - Average Patient Wait Time (14.2 minutes).
  - Lab Turnaround Time (3.8 hours).
  - Demographic distribution chart.
- Scroll down to review the immutable Security Audit Trail.

### Verbal Script:
> "Finally, we arrive at the Hospital Administrator Dashboard.
>
> Every chart you see here—appointment utilization, average patient wait times, laboratory turnaround percentiles, and population demographics—is dynamically calculated by our separate Python FastAPI microservice. There are zero hardcoded statistics.
>
> Scrolling down, the administrator can monitor the system audit trail, tracking every login, record access, and status change to ensure full compliance with privacy standards.
>
> MediCore satisfies all 15 mandatory assessments, backed by 24 passing Jest integration tests, 10 passing Pytest analytics tests, a complete OpenAPI specification, Docker Compose containerization, and automated disaster recovery scripts.
>
> Thank you for watching this demonstration of MediCore."

-- MediCore PostgreSQL Migration
-- Assessment 03: Clinical Relational Database Initial Schema

-- Create Custom Enums
CREATE TYPE "Role" AS ENUM ('PATIENT', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'BILLING_OFFICER', 'ADMIN');
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');
CREATE TYPE "AppointmentType" AS ENUM ('ROUTINE', 'FOLLOW_UP', 'EMERGENCY', 'SPECIALIST');
CREATE TYPE "EncounterStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "EncounterType" AS ENUM ('OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'AMBULATORY');
CREATE TYPE "DiagnosisType" AS ENUM ('PRIMARY', 'SECONDARY', 'ADMISSION', 'DISCHARGE');
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'FILLED', 'DISCONTINUED', 'EXPIRED');
CREATE TYPE "LabOrderStatus" AS ENUM ('PENDING', 'COLLECTED', 'IN_ANALYSIS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "LabPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');
CREATE TYPE "LabInterpretation" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'CRITICAL', 'ABNORMAL');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED');
CREATE TYPE "InvoiceCategory" AS ENUM ('CONSULTATION', 'LAB_TEST', 'MEDICATION', 'PROCEDURE', 'ROOM_CHARGE');
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH', 'BANK_TRANSFER', 'INSURANCE', 'SIMULATED');
CREATE TYPE "ConsentType" AS ENUM ('GENERAL_CARE', 'CLINICAL_DATA_SHARING', 'RESEARCH', 'LAB_DATA_ACCESS', 'EMERGENCY_OVERRIDE');
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- 1. User Table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_email_idx" ON "User"("email");

-- 2. Refresh Token Table
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "replacedByToken" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- 3. Department Table
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "building" TEXT,
    "floor" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Doctor Profile Table
CREATE TABLE "DoctorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "departmentId" TEXT NOT NULL REFERENCES "Department"("id"),
    "licenseNumber" TEXT NOT NULL UNIQUE,
    "specialization" TEXT NOT NULL,
    "consultationFee" DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    "roomNumber" TEXT,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "DoctorProfile_departmentId_idx" ON "DoctorProfile"("departmentId");
CREATE INDEX "DoctorProfile_specialization_idx" ON "DoctorProfile"("specialization");

-- 5. Doctor Availability
CREATE TABLE "DoctorAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL REFERENCES "DoctorProfile"("id") ON DELETE CASCADE,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX "DoctorAvailability_doctor_day_idx" ON "DoctorAvailability"("doctorId", "dayOfWeek");

-- 6. Patient Profile Table
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "mrn" TEXT NOT NULL UNIQUE,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "insuranceProvider" TEXT,
    "insurancePolicyNumber" TEXT,
    "allergies" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PatientProfile_mrn_idx" ON "PatientProfile"("mrn");

-- 7. Appointment Table
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentNumber" TEXT NOT NULL UNIQUE,
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id"),
    "doctorId" TEXT NOT NULL REFERENCES "DoctorProfile"("id"),
    "departmentId" TEXT NOT NULL REFERENCES "Department"("id"),
    "scheduledStartTime" TIMESTAMP(3) NOT NULL,
    "scheduledEndTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "type" "AppointmentType" NOT NULL DEFAULT 'ROUTINE',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");
CREATE INDEX "Appointment_doctor_time_idx" ON "Appointment"("doctorId", "scheduledStartTime");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- 8. Waiting List Table
CREATE TABLE "WaitingList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "departmentId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "WaitingList_dept_status_idx" ON "WaitingList"("departmentId", "status");

-- 9. Encounter Table
CREATE TABLE "Encounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "encounterNumber" TEXT NOT NULL UNIQUE,
    "appointmentId" TEXT NOT NULL UNIQUE REFERENCES "Appointment"("id"),
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id"),
    "doctorId" TEXT NOT NULL REFERENCES "DoctorProfile"("id"),
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "EncounterStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "type" "EncounterType" NOT NULL DEFAULT 'OUTPATIENT',
    "chiefComplaint" TEXT NOT NULL,
    "clinicalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Encounter_patientId_idx" ON "Encounter"("patientId");
CREATE INDEX "Encounter_doctorId_idx" ON "Encounter"("doctorId");

-- 10. Vital Signs Table
CREATE TABLE "VitalSigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "encounterId" TEXT NOT NULL REFERENCES "Encounter"("id") ON DELETE CASCADE,
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id"),
    "recordedByUserId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systolicBp" INTEGER NOT NULL,
    "diastolicBp" INTEGER NOT NULL,
    "heartRate" INTEGER NOT NULL,
    "respiratoryRate" INTEGER,
    "temperature" DECIMAL(4,1),
    "oxygenSaturation" INTEGER,
    "heightCm" DECIMAL(5,2),
    "weightKg" DECIMAL(5,2),
    "bmi" DECIMAL(4,1),
    "notes" TEXT
);
CREATE INDEX "VitalSigns_encounterId_idx" ON "VitalSigns"("encounterId");
CREATE INDEX "VitalSigns_patientId_idx" ON "VitalSigns"("patientId");

-- 11. Diagnosis Table
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "encounterId" TEXT NOT NULL REFERENCES "Encounter"("id") ON DELETE CASCADE,
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id"),
    "doctorId" TEXT NOT NULL,
    "icdCode" TEXT NOT NULL,
    "icdDescription" TEXT NOT NULL,
    "type" "DiagnosisType" NOT NULL DEFAULT 'PRIMARY',
    "confidence" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Diagnosis_encounterId_idx" ON "Diagnosis"("encounterId");
CREATE INDEX "Diagnosis_patientId_idx" ON "Diagnosis"("patientId");
CREATE INDEX "Diagnosis_icdCode_idx" ON "Diagnosis"("icdCode");

-- 12. Prescription Table
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriptionNumber" TEXT NOT NULL UNIQUE,
    "encounterId" TEXT NOT NULL REFERENCES "Encounter"("id") ON DELETE CASCADE,
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id"),
    "doctorId" TEXT NOT NULL REFERENCES "DoctorProfile"("id"),
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "instructions" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Prescription_encounterId_idx" ON "Prescription"("encounterId");
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- 13. Prescription Item Table
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescriptionId" TEXT NOT NULL REFERENCES "Prescription"("id") ON DELETE CASCADE,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "route" TEXT NOT NULL DEFAULT 'Oral',
    "frequency" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refillsAllowed" INTEGER NOT NULL DEFAULT 0,
    "precautions" TEXT
);
CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");

-- 14. Lab Order Table
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "encounterId" TEXT NOT NULL REFERENCES "Encounter"("id") ON DELETE CASCADE,
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id"),
    "orderingDoctorId" TEXT NOT NULL REFERENCES "DoctorProfile"("id"),
    "status" "LabOrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "LabPriority" NOT NULL DEFAULT 'ROUTINE',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testPanelName" TEXT NOT NULL,
    "clinicalIndication" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "LabOrder_encounterId_idx" ON "LabOrder"("encounterId");
CREATE INDEX "LabOrder_patientId_idx" ON "LabOrder"("patientId");
CREATE INDEX "LabOrder_status_idx" ON "LabOrder"("status");

-- 15. Lab Result Table
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labOrderId" TEXT NOT NULL REFERENCES "LabOrder"("id") ON DELETE CASCADE,
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id"),
    "technicianUserId" TEXT,
    "validatedByUserId" TEXT,
    "testName" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "measuredValue" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "referenceRangeLow" TEXT,
    "referenceRangeHigh" TEXT,
    "interpretation" "LabInterpretation" NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'FINAL',
    "specimenType" TEXT NOT NULL DEFAULT 'Blood - Serum',
    "remarks" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3)
);
CREATE INDEX "LabResult_labOrderId_idx" ON "LabResult"("labOrderId");
CREATE INDEX "LabResult_patientId_idx" ON "LabResult"("patientId");

-- 16. Invoice Table
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id"),
    "encounterId" TEXT REFERENCES "Encounter"("id"),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "balanceAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Invoice_patientId_idx" ON "Invoice"("patientId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- 17. Invoice Item Table
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
    "description" TEXT NOT NULL,
    "category" "InvoiceCategory" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL
);
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- 18. Payment Table
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
    "patientId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'SIMULATED',
    "amount" DECIMAL(10,2) NOT NULL,
    "transactionReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Payment_patientId_idx" ON "Payment"("patientId");

-- 19. Consent Record Table
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL REFERENCES "PatientProfile"("id") ON DELETE CASCADE,
    "consentType" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedToRole" "Role",
    "grantedToUserId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "ipAddress" TEXT
);
CREATE INDEX "ConsentRecord_patient_type_idx" ON "ConsentRecord"("patientId", "consentType");

-- 20. Audit Log Table
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT,
    "performedByUserId" TEXT NOT NULL REFERENCES "User"("id"),
    "userRole" "Role" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestCorrelationId" TEXT
);
CREATE INDEX "AuditLog_user_idx" ON "AuditLog"("performedByUserId");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entityName", "entityId");
CREATE INDEX "AuditLog_time_idx" ON "AuditLog"("timestamp");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- 21. Notification Table
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Notification_user_status_idx" ON "Notification"("userId", "status");

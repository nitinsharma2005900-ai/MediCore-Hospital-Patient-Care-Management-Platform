--
-- PostgreSQL database dump
--

\restrict iyp0L0DWfJz6e6UQxsIJDYpZyDaOxV8xxXYXkB4Trap0uuREtGa8CHvWlRBOeFT

-- Dumped from database version 17.12
-- Dumped by pg_dump version 17.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'REQUESTED',
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'RESCHEDULED'
);


--
-- Name: AppointmentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AppointmentType" AS ENUM (
    'ROUTINE',
    'FOLLOW_UP',
    'EMERGENCY',
    'SPECIALIST'
);


--
-- Name: ConsentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConsentType" AS ENUM (
    'GENERAL_CARE',
    'CLINICAL_DATA_SHARING',
    'RESEARCH',
    'LAB_DATA_ACCESS',
    'EMERGENCY_OVERRIDE'
);


--
-- Name: DiagnosisType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DiagnosisType" AS ENUM (
    'PRIMARY',
    'SECONDARY',
    'ADMISSION',
    'DISCHARGE'
);


--
-- Name: EncounterStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EncounterStatus" AS ENUM (
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: EncounterType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EncounterType" AS ENUM (
    'OUTPATIENT',
    'INPATIENT',
    'EMERGENCY',
    'AMBULATORY'
);


--
-- Name: InvoiceCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceCategory" AS ENUM (
    'CONSULTATION',
    'LAB_TEST',
    'MEDICATION',
    'PROCEDURE',
    'ROOM_CHARGE'
);


--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'DRAFT',
    'ISSUED',
    'PARTIALLY_PAID',
    'PAID',
    'CANCELLED',
    'REFUNDED'
);


--
-- Name: LabInterpretation; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LabInterpretation" AS ENUM (
    'NORMAL',
    'LOW',
    'HIGH',
    'CRITICAL',
    'ABNORMAL'
);


--
-- Name: LabOrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LabOrderStatus" AS ENUM (
    'PENDING',
    'COLLECTED',
    'IN_ANALYSIS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: LabPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LabPriority" AS ENUM (
    'ROUTINE',
    'URGENT',
    'STAT'
);


--
-- Name: NotificationChannel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationChannel" AS ENUM (
    'IN_APP',
    'EMAIL',
    'SMS'
);


--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'READ'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CARD',
    'CASH',
    'BANK_TRANSFER',
    'INSURANCE',
    'SIMULATED'
);


--
-- Name: PrescriptionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PrescriptionStatus" AS ENUM (
    'ACTIVE',
    'FILLED',
    'DISCONTINUED',
    'EXPIRED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'PATIENT',
    'RECEPTIONIST',
    'DOCTOR',
    'NURSE',
    'LAB_TECHNICIAN',
    'BILLING_OFFICER',
    'ADMIN'
);


--
-- Name: prevent_audit_mutation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_audit_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'Audit history is append-only' USING ERRCODE='42501';
END $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Appointment" (
    id text NOT NULL,
    "appointmentNumber" text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "departmentId" text NOT NULL,
    "scheduledStartTime" timestamp with time zone NOT NULL,
    "scheduledEndTime" timestamp with time zone NOT NULL,
    status public."AppointmentStatus" DEFAULT 'REQUESTED'::public."AppointmentStatus" NOT NULL,
    type public."AppointmentType" DEFAULT 'ROUTINE'::public."AppointmentType" NOT NULL,
    reason text NOT NULL,
    notes text,
    "cancellationReason" text,
    "cancelledAt" timestamp with time zone,
    "cancelledBy" text,
    "checkedInAt" timestamp with time zone,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT appointment_positive_duration CHECK (("scheduledEndTime" > "scheduledStartTime"))
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    action text NOT NULL,
    "entityName" text NOT NULL,
    "entityId" text,
    "performedByUserId" text,
    "userRole" public."Role" NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    details text,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "requestCorrelationId" text
);


--
-- Name: CareAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CareAssignment" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "nurseUserId" text NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: ConsentRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ConsentRecord" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "consentType" public."ConsentType" NOT NULL,
    granted boolean DEFAULT true NOT NULL,
    "grantedToRole" public."Role",
    "grantedToUserId" text,
    "grantedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "revokedAt" timestamp with time zone,
    "revocationReason" text,
    "expiresAt" timestamp with time zone,
    "ipAddress" text
);


--
-- Name: Department; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    building text,
    floor integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Diagnosis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Diagnosis" (
    id text NOT NULL,
    "encounterId" text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "icdCode" text NOT NULL,
    "icdDescription" text NOT NULL,
    type public."DiagnosisType" DEFAULT 'PRIMARY'::public."DiagnosisType" NOT NULL,
    confidence text DEFAULT 'CONFIRMED'::text NOT NULL,
    notes text,
    "diagnosedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DoctorAvailability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DoctorAvailability" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "slotDurationMinutes" integer DEFAULT 30 NOT NULL,
    "timeZone" text DEFAULT 'UTC'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: DoctorProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DoctorProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "departmentId" text NOT NULL,
    "licenseNumber" text NOT NULL,
    specialization text NOT NULL,
    "consultationFee" numeric(10,2) DEFAULT 150.00 NOT NULL,
    "roomNumber" text,
    bio text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Encounter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Encounter" (
    id text NOT NULL,
    "encounterNumber" text NOT NULL,
    "appointmentId" text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "startTime" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endTime" timestamp with time zone,
    status public."EncounterStatus" DEFAULT 'IN_PROGRESS'::public."EncounterStatus" NOT NULL,
    type public."EncounterType" DEFAULT 'OUTPATIENT'::public."EncounterType" NOT NULL,
    "chiefComplaint" text NOT NULL,
    "clinicalNotes" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "invoiceNumber" text NOT NULL,
    "patientId" text NOT NULL,
    "encounterId" text,
    status public."InvoiceStatus" DEFAULT 'ISSUED'::public."InvoiceStatus" NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    "paidAmount" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "balanceAmount" numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "issuedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueDate" timestamp with time zone,
    "paidAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InvoiceItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    description text NOT NULL,
    category public."InvoiceCategory" NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    CONSTRAINT invoice_item_positive CHECK (((quantity > 0) AND ("unitPrice" >= (0)::numeric)))
);


--
-- Name: LabOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LabOrder" (
    id text NOT NULL,
    "orderNumber" text NOT NULL,
    "encounterId" text NOT NULL,
    "patientId" text NOT NULL,
    "orderingDoctorId" text NOT NULL,
    status public."LabOrderStatus" DEFAULT 'PENDING'::public."LabOrderStatus" NOT NULL,
    priority public."LabPriority" DEFAULT 'ROUTINE'::public."LabPriority" NOT NULL,
    "orderDate" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "testPanelName" text NOT NULL,
    "clinicalIndication" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assignedTechnicianUserId" text
);


--
-- Name: LabResult; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LabResult" (
    id text NOT NULL,
    "labOrderId" text NOT NULL,
    "patientId" text NOT NULL,
    "technicianUserId" text,
    "validatedByUserId" text,
    "testName" text NOT NULL,
    "testCode" text NOT NULL,
    "measuredValue" text NOT NULL,
    unit text NOT NULL,
    "referenceRangeLow" text,
    "referenceRangeHigh" text,
    interpretation public."LabInterpretation" DEFAULT 'NORMAL'::public."LabInterpretation" NOT NULL,
    status text DEFAULT 'FINAL'::text NOT NULL,
    "specimenType" text DEFAULT 'Blood - Serum'::text NOT NULL,
    remarks text,
    "completedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validatedAt" timestamp with time zone
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    channel public."NotificationChannel" DEFAULT 'IN_APP'::public."NotificationChannel" NOT NULL,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    "sentAt" timestamp with time zone,
    "readAt" timestamp with time zone,
    metadata text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: NotificationDelivery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."NotificationDelivery" (
    id text NOT NULL,
    "notificationId" text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "lastError" text,
    "deliveredAt" timestamp with time zone,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: PatientProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PatientProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    mrn text NOT NULL,
    "dateOfBirth" timestamp with time zone NOT NULL,
    gender text NOT NULL,
    "bloodGroup" text,
    "emergencyContactName" text NOT NULL,
    "emergencyContactPhone" text NOT NULL,
    address text NOT NULL,
    "insuranceProvider" text,
    "insurancePolicyNumber" text,
    allergies text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    "patientId" text NOT NULL,
    "paymentMethod" public."PaymentMethod" DEFAULT 'SIMULATED'::public."PaymentMethod" NOT NULL,
    amount numeric(10,2) NOT NULL,
    "transactionReference" text,
    status text DEFAULT 'SUCCESS'::text NOT NULL,
    "paymentDate" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT payment_positive CHECK ((amount > (0)::numeric))
);


--
-- Name: Prescription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Prescription" (
    id text NOT NULL,
    "prescriptionNumber" text NOT NULL,
    "encounterId" text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    status public."PrescriptionStatus" DEFAULT 'ACTIVE'::public."PrescriptionStatus" NOT NULL,
    instructions text,
    "startDate" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PrescriptionItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PrescriptionItem" (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    "medicationName" text NOT NULL,
    dosage text NOT NULL,
    route text DEFAULT 'Oral'::text NOT NULL,
    frequency text NOT NULL,
    "durationDays" integer NOT NULL,
    quantity integer NOT NULL,
    "refillsAllowed" integer DEFAULT 0 NOT NULL,
    precautions text,
    CONSTRAINT prescription_quantity_positive CHECK (((quantity > 0) AND ("durationDays" > 0) AND ("refillsAllowed" >= 0)))
);


--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    "tokenHash" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    "revokedAt" timestamp with time zone,
    "replacedByToken" text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "accessTokenId" text
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."Role" NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: VitalSigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VitalSigns" (
    id text NOT NULL,
    "encounterId" text NOT NULL,
    "patientId" text NOT NULL,
    "recordedByUserId" text NOT NULL,
    "recordedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "systolicBp" integer NOT NULL,
    "diastolicBp" integer NOT NULL,
    "heartRate" integer NOT NULL,
    "respiratoryRate" integer,
    temperature numeric(4,1),
    "oxygenSaturation" integer,
    "heightCm" numeric(5,2),
    "weightKg" numeric(5,2),
    bmi numeric(4,1),
    notes text
);


--
-- Name: WaitingList; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WaitingList" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text,
    "departmentId" text NOT NULL,
    "preferredDate" timestamp with time zone NOT NULL,
    "urgencyLevel" text DEFAULT 'MEDIUM'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    notes text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    name text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: Appointment Appointment_appointmentNumber_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_appointmentNumber_key" UNIQUE ("appointmentNumber");


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CareAssignment CareAssignment_patientId_nurseUserId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareAssignment"
    ADD CONSTRAINT "CareAssignment_patientId_nurseUserId_key" UNIQUE ("patientId", "nurseUserId");


--
-- Name: CareAssignment CareAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareAssignment"
    ADD CONSTRAINT "CareAssignment_pkey" PRIMARY KEY (id);


--
-- Name: ConsentRecord ConsentRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConsentRecord"
    ADD CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_code_key" UNIQUE (code);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Diagnosis Diagnosis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_pkey" PRIMARY KEY (id);


--
-- Name: DoctorAvailability DoctorAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorAvailability"
    ADD CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY (id);


--
-- Name: DoctorProfile DoctorProfile_licenseNumber_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_licenseNumber_key" UNIQUE ("licenseNumber");


--
-- Name: DoctorProfile DoctorProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY (id);


--
-- Name: DoctorProfile DoctorProfile_userId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_userId_key" UNIQUE ("userId");


--
-- Name: Encounter Encounter_appointmentId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_appointmentId_key" UNIQUE ("appointmentId");


--
-- Name: Encounter Encounter_encounterNumber_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_encounterNumber_key" UNIQUE ("encounterNumber");


--
-- Name: Encounter Encounter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItem InvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_invoiceNumber_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_invoiceNumber_key" UNIQUE ("invoiceNumber");


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: LabOrder LabOrder_orderNumber_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_orderNumber_key" UNIQUE ("orderNumber");


--
-- Name: LabOrder LabOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_pkey" PRIMARY KEY (id);


--
-- Name: LabResult LabResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT "LabResult_pkey" PRIMARY KEY (id);


--
-- Name: NotificationDelivery NotificationDelivery_notificationId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NotificationDelivery"
    ADD CONSTRAINT "NotificationDelivery_notificationId_key" UNIQUE ("notificationId");


--
-- Name: NotificationDelivery NotificationDelivery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NotificationDelivery"
    ADD CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PatientProfile PatientProfile_mrn_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PatientProfile"
    ADD CONSTRAINT "PatientProfile_mrn_key" UNIQUE (mrn);


--
-- Name: PatientProfile PatientProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PatientProfile"
    ADD CONSTRAINT "PatientProfile_pkey" PRIMARY KEY (id);


--
-- Name: PatientProfile PatientProfile_userId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PatientProfile"
    ADD CONSTRAINT "PatientProfile_userId_key" UNIQUE ("userId");


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PrescriptionItem PrescriptionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY (id);


--
-- Name: Prescription Prescription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_pkey" PRIMARY KEY (id);


--
-- Name: Prescription Prescription_prescriptionNumber_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_prescriptionNumber_key" UNIQUE ("prescriptionNumber");


--
-- Name: RefreshToken RefreshToken_accessTokenId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_accessTokenId_key" UNIQUE ("accessTokenId");


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_tokenHash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_tokenHash_key" UNIQUE ("tokenHash");


--
-- Name: User User_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VitalSigns VitalSigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VitalSigns"
    ADD CONSTRAINT "VitalSigns_pkey" PRIMARY KEY (id);


--
-- Name: WaitingList WaitingList_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WaitingList"
    ADD CONSTRAINT "WaitingList_pkey" PRIMARY KEY (id);


--
-- Name: Appointment appointment_association; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT appointment_association UNIQUE (id, "patientId", "doctorId");


--
-- Name: Appointment appointment_no_overlap; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT appointment_no_overlap EXCLUDE USING gist ("doctorId" WITH =, tstzrange("scheduledStartTime", "scheduledEndTime", '[)'::text) WITH &&) WHERE ((status <> ALL (ARRAY['CANCELLED'::public."AppointmentStatus", 'NO_SHOW'::public."AppointmentStatus", 'RESCHEDULED'::public."AppointmentStatus"])));


--
-- Name: DoctorProfile doctor_department; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT doctor_department UNIQUE (id, "departmentId");


--
-- Name: Encounter encounter_patient; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT encounter_patient UNIQUE (id, "patientId");


--
-- Name: Invoice invoice_patient; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT invoice_patient UNIQUE (id, "patientId");


--
-- Name: LabOrder lab_order_patient; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT lab_order_patient UNIQUE (id, "patientId");


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (name);


--
-- Name: Appointment_doctor_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_doctor_time_idx" ON public."Appointment" USING btree ("doctorId", "scheduledStartTime");


--
-- Name: Appointment_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_patientId_idx" ON public."Appointment" USING btree ("patientId");


--
-- Name: Appointment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_status_idx" ON public."Appointment" USING btree (status);


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entity_idx" ON public."AuditLog" USING btree ("entityName", "entityId");


--
-- Name: AuditLog_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_time_idx" ON public."AuditLog" USING btree ("timestamp");


--
-- Name: AuditLog_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_user_idx" ON public."AuditLog" USING btree ("performedByUserId");


--
-- Name: ConsentRecord_patient_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConsentRecord_patient_type_idx" ON public."ConsentRecord" USING btree ("patientId", "consentType");


--
-- Name: Diagnosis_encounterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Diagnosis_encounterId_idx" ON public."Diagnosis" USING btree ("encounterId");


--
-- Name: Diagnosis_icdCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Diagnosis_icdCode_idx" ON public."Diagnosis" USING btree ("icdCode");


--
-- Name: Diagnosis_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Diagnosis_patientId_idx" ON public."Diagnosis" USING btree ("patientId");


--
-- Name: DoctorAvailability_doctor_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DoctorAvailability_doctor_day_idx" ON public."DoctorAvailability" USING btree ("doctorId", "dayOfWeek");


--
-- Name: DoctorProfile_departmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DoctorProfile_departmentId_idx" ON public."DoctorProfile" USING btree ("departmentId");


--
-- Name: DoctorProfile_specialization_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DoctorProfile_specialization_idx" ON public."DoctorProfile" USING btree (specialization);


--
-- Name: Encounter_doctorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Encounter_doctorId_idx" ON public."Encounter" USING btree ("doctorId");


--
-- Name: Encounter_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Encounter_patientId_idx" ON public."Encounter" USING btree ("patientId");


--
-- Name: InvoiceItem_invoiceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InvoiceItem_invoiceId_idx" ON public."InvoiceItem" USING btree ("invoiceId");


--
-- Name: Invoice_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Invoice_patientId_idx" ON public."Invoice" USING btree ("patientId");


--
-- Name: Invoice_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Invoice_status_idx" ON public."Invoice" USING btree (status);


--
-- Name: LabOrder_encounterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LabOrder_encounterId_idx" ON public."LabOrder" USING btree ("encounterId");


--
-- Name: LabOrder_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LabOrder_patientId_idx" ON public."LabOrder" USING btree ("patientId");


--
-- Name: LabOrder_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LabOrder_status_idx" ON public."LabOrder" USING btree (status);


--
-- Name: LabResult_labOrderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LabResult_labOrderId_idx" ON public."LabResult" USING btree ("labOrderId");


--
-- Name: LabResult_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LabResult_patientId_idx" ON public."LabResult" USING btree ("patientId");


--
-- Name: Notification_user_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_user_status_idx" ON public."Notification" USING btree ("userId", status);


--
-- Name: PatientProfile_mrn_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PatientProfile_mrn_idx" ON public."PatientProfile" USING btree (mrn);


--
-- Name: Payment_invoiceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payment_invoiceId_idx" ON public."Payment" USING btree ("invoiceId");


--
-- Name: Payment_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payment_patientId_idx" ON public."Payment" USING btree ("patientId");


--
-- Name: PrescriptionItem_prescriptionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON public."PrescriptionItem" USING btree ("prescriptionId");


--
-- Name: Prescription_encounterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Prescription_encounterId_idx" ON public."Prescription" USING btree ("encounterId");


--
-- Name: Prescription_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Prescription_patientId_idx" ON public."Prescription" USING btree ("patientId");


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: VitalSigns_encounterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VitalSigns_encounterId_idx" ON public."VitalSigns" USING btree ("encounterId");


--
-- Name: VitalSigns_patientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VitalSigns_patientId_idx" ON public."VitalSigns" USING btree ("patientId");


--
-- Name: WaitingList_dept_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WaitingList_dept_status_idx" ON public."WaitingList" USING btree ("departmentId", status);


--
-- Name: lab_assignee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lab_assignee_idx ON public."LabOrder" USING btree ("assignedTechnicianUserId");


--
-- Name: payment_reference_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_reference_unique ON public."Payment" USING btree ("transactionReference") WHERE ("transactionReference" IS NOT NULL);


--
-- Name: refresh_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_active_idx ON public."RefreshToken" USING btree ("userId", revoked, "expiresAt");


--
-- Name: user_email_case_insensitive; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_email_case_insensitive ON public."User" USING btree (lower(email));


--
-- Name: AuditLog audit_history_immutable; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_history_immutable BEFORE DELETE OR UPDATE ON public."AuditLog" FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_mutation();


--
-- Name: Appointment Appointment_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id);


--
-- Name: Appointment Appointment_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."DoctorProfile"(id);


--
-- Name: Appointment Appointment_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: AuditLog AuditLog_performedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES public."User"(id);


--
-- Name: CareAssignment CareAssignment_nurseUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareAssignment"
    ADD CONSTRAINT "CareAssignment_nurseUserId_fkey" FOREIGN KEY ("nurseUserId") REFERENCES public."User"(id);


--
-- Name: CareAssignment CareAssignment_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareAssignment"
    ADD CONSTRAINT "CareAssignment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: ConsentRecord ConsentRecord_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConsentRecord"
    ADD CONSTRAINT "ConsentRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id) ON DELETE CASCADE;


--
-- Name: Diagnosis Diagnosis_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON DELETE CASCADE;


--
-- Name: Diagnosis Diagnosis_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: DoctorAvailability DoctorAvailability_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorAvailability"
    ADD CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."DoctorProfile"(id) ON DELETE CASCADE;


--
-- Name: DoctorProfile DoctorProfile_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id);


--
-- Name: DoctorProfile DoctorProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorProfile"
    ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: Encounter Encounter_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id);


--
-- Name: Encounter Encounter_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."DoctorProfile"(id);


--
-- Name: Encounter Encounter_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON DELETE CASCADE;


--
-- Name: Invoice Invoice_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id);


--
-- Name: Invoice Invoice_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: LabOrder LabOrder_assignedTechnicianUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_assignedTechnicianUserId_fkey" FOREIGN KEY ("assignedTechnicianUserId") REFERENCES public."User"(id);


--
-- Name: LabOrder LabOrder_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON DELETE CASCADE;


--
-- Name: LabOrder LabOrder_orderingDoctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_orderingDoctorId_fkey" FOREIGN KEY ("orderingDoctorId") REFERENCES public."DoctorProfile"(id);


--
-- Name: LabOrder LabOrder_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: LabResult LabResult_labOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT "LabResult_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES public."LabOrder"(id) ON DELETE CASCADE;


--
-- Name: LabResult LabResult_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT "LabResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: NotificationDelivery NotificationDelivery_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NotificationDelivery"
    ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public."Notification"(id);


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: PatientProfile PatientProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PatientProfile"
    ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: Payment Payment_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON DELETE CASCADE;


--
-- Name: PrescriptionItem PrescriptionItem_prescriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public."Prescription"(id) ON DELETE CASCADE;


--
-- Name: Prescription Prescription_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."DoctorProfile"(id);


--
-- Name: Prescription Prescription_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON DELETE CASCADE;


--
-- Name: Prescription Prescription_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- Name: VitalSigns VitalSigns_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VitalSigns"
    ADD CONSTRAINT "VitalSigns_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON DELETE CASCADE;


--
-- Name: VitalSigns VitalSigns_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VitalSigns"
    ADD CONSTRAINT "VitalSigns_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: WaitingList WaitingList_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WaitingList"
    ADD CONSTRAINT "WaitingList_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id);


--
-- Name: WaitingList WaitingList_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WaitingList"
    ADD CONSTRAINT "WaitingList_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."DoctorProfile"(id);


--
-- Name: WaitingList WaitingList_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WaitingList"
    ADD CONSTRAINT "WaitingList_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."PatientProfile"(id);


--
-- Name: Appointment appointment_provider_department; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT appointment_provider_department FOREIGN KEY ("doctorId", "departmentId") REFERENCES public."DoctorProfile"(id, "departmentId");


--
-- Name: Diagnosis diagnosis_doctor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT diagnosis_doctor FOREIGN KEY ("doctorId") REFERENCES public."DoctorProfile"(id);


--
-- Name: Diagnosis diagnosis_encounter_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT diagnosis_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES public."Encounter"(id, "patientId");


--
-- Name: Encounter encounter_appointment_association; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT encounter_appointment_association FOREIGN KEY ("appointmentId", "patientId", "doctorId") REFERENCES public."Appointment"(id, "patientId", "doctorId");


--
-- Name: Invoice invoice_encounter_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT invoice_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES public."Encounter"(id, "patientId");


--
-- Name: LabOrder lab_encounter_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT lab_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES public."Encounter"(id, "patientId");


--
-- Name: LabResult lab_result_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT lab_result_patient FOREIGN KEY ("labOrderId", "patientId") REFERENCES public."LabOrder"(id, "patientId");


--
-- Name: Payment payment_invoice_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT payment_invoice_patient FOREIGN KEY ("invoiceId", "patientId") REFERENCES public."Invoice"(id, "patientId");


--
-- Name: Prescription prescription_encounter_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT prescription_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES public."Encounter"(id, "patientId");


--
-- Name: LabResult result_technician; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT result_technician FOREIGN KEY ("technicianUserId") REFERENCES public."User"(id);


--
-- Name: LabResult result_validator; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT result_validator FOREIGN KEY ("validatedByUserId") REFERENCES public."User"(id);


--
-- Name: VitalSigns vital_encounter_patient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VitalSigns"
    ADD CONSTRAINT vital_encounter_patient FOREIGN KEY ("encounterId", "patientId") REFERENCES public."Encounter"(id, "patientId");


--
-- Name: VitalSigns vital_recorder; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VitalSigns"
    ADD CONSTRAINT vital_recorder FOREIGN KEY ("recordedByUserId") REFERENCES public."User"(id);


--
-- PostgreSQL database dump complete
--

\unrestrict iyp0L0DWfJz6e6UQxsIJDYpZyDaOxV8xxXYXkB4Trap0uuREtGa8CHvWlRBOeFT


import { z } from 'zod';

// ============================================================================
// 1. SYSTEM ENUMS & ROLE DEFINITIONS
// ============================================================================

export enum UserRole {
  PATIENT = 'PATIENT',
  RECEPTIONIST = 'RECEPTIONIST',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  BILLING_OFFICER = 'BILLING_OFFICER',
  ADMIN = 'ADMIN'
}

export enum AppointmentStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

export enum AppointmentType {
  ROUTINE = 'ROUTINE',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  SPECIALIST = 'SPECIALIST'
}

export enum EncounterStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum EncounterType {
  OUTPATIENT = 'OUTPATIENT',
  INPATIENT = 'INPATIENT',
  EMERGENCY = 'EMERGENCY',
  AMBULATORY = 'AMBULATORY'
}

export enum DiagnosisType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  ADMISSION = 'ADMISSION',
  DISCHARGE = 'DISCHARGE'
}

export enum PrescriptionStatus {
  ACTIVE = 'ACTIVE',
  FILLED = 'FILLED',
  DISCONTINUED = 'DISCONTINUED',
  EXPIRED = 'EXPIRED'
}

export enum LabOrderStatus {
  PENDING = 'PENDING',
  COLLECTED = 'COLLECTED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum LabPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  STAT = 'STAT'
}

export enum LabInterpretation {
  NORMAL = 'NORMAL',
  LOW = 'LOW',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  ABNORMAL = 'ABNORMAL'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum InvoiceCategory {
  CONSULTATION = 'CONSULTATION',
  LAB_TEST = 'LAB_TEST',
  MEDICATION = 'MEDICATION',
  PROCEDURE = 'PROCEDURE',
  ROOM_CHARGE = 'ROOM_CHARGE'
}

export enum PaymentMethod {
  CARD = 'CARD',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  INSURANCE = 'INSURANCE',
  SIMULATED = 'SIMULATED'
}

export enum ConsentType {
  GENERAL_CARE = 'GENERAL_CARE',
  CLINICAL_DATA_SHARING = 'CLINICAL_DATA_SHARING',
  RESEARCH = 'RESEARCH',
  LAB_DATA_ACCESS = 'LAB_DATA_ACCESS',
  EMERGENCY_OVERRIDE = 'EMERGENCY_OVERRIDE'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ'
}

// ============================================================================
// 2. API ENVELOPES & COMMON TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    requestId?: string;
    timestamp?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  patientProfileId?: string | null;
  doctorProfileId?: string | null;
}

// ============================================================================
// 3. VALIDATION SCHEMAS (ZOD)
// ============================================================================

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const RegisterPatientSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(7, 'Valid contact number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  emergencyContactName: z.string().min(2, 'Emergency contact is required'),
  emergencyContactPhone: z.string().min(7, 'Emergency contact phone is required'),
  address: z.string().min(5, 'Residential address is required'),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  allergies: z.string().optional()
});

export const CreateAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(),
  doctorId: z.string().uuid('Invalid doctor ID'),
  departmentId: z.string().uuid('Invalid department ID'),
  scheduledStartTime: z.string().datetime('Valid ISO-8601 start time required'),
  scheduledEndTime: z.string().datetime('Valid ISO-8601 end time required'),
  type: z.nativeEnum(AppointmentType).default(AppointmentType.ROUTINE),
  reason: z.string().min(3, 'Reason for visit must be at least 3 characters'),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL')
});

export const RescheduleAppointmentSchema = z.object({
  newStartTime: z.string().datetime('Valid ISO-8601 start time required'),
  newEndTime: z.string().datetime('Valid ISO-8601 end time required'),
  reason: z.string().min(3, 'Reschedule reason is required')
});

export const CancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(3, 'Cancellation reason is required')
});

export const CheckInPatientSchema = z.object({
  notes: z.string().optional()
});

export const CreateEncounterSchema = z.object({
  appointmentId: z.string().uuid('Appointment ID is required'),
  patientId: z.string().uuid('Patient ID is required'),
  chiefComplaint: z.string().min(3, 'Chief complaint is required'),
  clinicalNotes: z.string().optional(),
  type: z.nativeEnum(EncounterType).default(EncounterType.OUTPATIENT)
});

export const RecordVitalsSchema = z.object({
  encounterId: z.string().uuid('Encounter ID is required'),
  patientId: z.string().uuid('Patient ID is required'),
  systolicBp: z.number().min(50).max(280),
  diastolicBp: z.number().min(30).max(180),
  heartRate: z.number().min(30).max(250),
  respiratoryRate: z.number().min(6).max(60).optional(),
  temperature: z.number().min(30).max(45).optional(), // in Celsius
  oxygenSaturation: z.number().min(50).max(100).optional(),
  heightCm: z.number().min(30).max(250).optional(),
  weightKg: z.number().min(1).max(400).optional(),
  notes: z.string().optional()
});

export const AddDiagnosisSchema = z.object({
  encounterId: z.string().uuid('Encounter ID is required'),
  patientId: z.string().uuid('Patient ID is required'),
  icdCode: z.string().min(2, 'Valid ICD-10 code required'),
  icdDescription: z.string().min(3, 'Diagnosis description required'),
  type: z.nativeEnum(DiagnosisType).default(DiagnosisType.PRIMARY),
  confidence: z.enum(['CONFIRMED', 'PROVISIONAL', 'DIFFERENTIAL']).default('CONFIRMED'),
  notes: z.string().optional()
});

export const CreatePrescriptionSchema = z.object({
  encounterId: z.string().uuid('Encounter ID is required'),
  patientId: z.string().uuid('Patient ID is required'),
  instructions: z.string().optional(),
  items: z.array(z.object({
    medicationName: z.string().min(2, 'Medication name required'),
    dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)'),
    route: z.string().default('Oral'),
    frequency: z.string().min(1, 'Frequency required (e.g., Twice daily)'),
    durationDays: z.number().min(1).max(365),
    quantity: z.number().min(1),
    refillsAllowed: z.number().min(0).default(0),
    precautions: z.string().optional()
  })).min(1, 'At least one prescription item is required')
});

export const CreateLabOrderSchema = z.object({
  encounterId: z.string().uuid('Encounter ID is required'),
  patientId: z.string().uuid('Patient ID is required'),
  testPanelName: z.string().min(3, 'Test panel or test name required'),
  clinicalIndication: z.string().optional(),
  priority: z.nativeEnum(LabPriority).default(LabPriority.ROUTINE)
});

export const EnterLabResultSchema = z.object({
  labOrderId: z.string().uuid('Lab Order ID is required'),
  patientId: z.string().uuid('Patient ID is required'),
  testName: z.string().min(2, 'Test name is required'),
  testCode: z.string().min(2, 'Test code (e.g., LOINC) is required'),
  measuredValue: z.string().min(1, 'Measured value is required'),
  unit: z.string().min(1, 'Measurement unit required'),
  referenceRangeLow: z.string().optional(),
  referenceRangeHigh: z.string().optional(),
  interpretation: z.nativeEnum(LabInterpretation).default(LabInterpretation.NORMAL),
  specimenType: z.string().default('Blood - Serum'),
  remarks: z.string().optional()
});

export const CreateInvoiceSchema = z.object({
  patientId: z.string().uuid('Patient ID is required'),
  encounterId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(2, 'Item description required'),
    category: z.nativeEnum(InvoiceCategory),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0)
  })).min(1, 'At least one invoice line item is required')
});

export const RecordPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invoice ID is required'),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.SIMULATED),
  amount: z.number().positive('Payment amount must be greater than zero'),
  transactionReference: z.string().optional()
});

export const UpdateConsentSchema = z.object({
  consentType: z.nativeEnum(ConsentType),
  granted: z.boolean(),
  grantedToRole: z.nativeEnum(UserRole).optional(),
  grantedToUserId: z.string().uuid().optional(),
  revocationReason: z.string().optional(),
  expiresAt: z.string().datetime().optional()
});

// ============================================================================
// 4. FHIR R4 SYNTHETIC TYPES
// ============================================================================

export interface FhirPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{ system: string; value: string }>;
  active: boolean;
  name: Array<{ family: string; given: string[]; use?: string }>;
  telecom: Array<{ system: 'phone' | 'email'; value: string; use?: string }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  address?: Array<{ line: string[]; city?: string; state?: string; postalCode?: string }>;
}

export interface FhirAppointment {
  resourceType: 'Appointment';
  id: string;
  status: 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow' | 'proposed';
  serviceCategory?: Array<{ coding: Array<{ code: string; display: string }> }>;
  description?: string;
  start: string;
  end: string;
  participant: Array<{
    actor: { reference: string; display?: string };
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
}

export interface FhirEncounter {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'finished' | 'cancelled';
  class: { system: string; code: string; display?: string };
  subject: { reference: string; display?: string };
  participant?: Array<{ individual: { reference: string; display?: string } }>;
  period: { start: string; end?: string };
  reasonCode?: Array<{ coding: Array<{ code?: string; display: string }> }>;
}

export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  code: { coding: Array<{ system: string; code: string; display: string }> };
  subject: { reference: string; display?: string };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  interpretation?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  referenceRange?: Array<{
    low?: { value: number; unit: string };
    high?: { value: number; unit: string };
    text?: string;
  }>;
}

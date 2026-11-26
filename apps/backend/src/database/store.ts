import { 
  UserRole, 
  AppointmentStatus, 
  AppointmentType, 
  EncounterStatus, 
  EncounterType, 
  DiagnosisType, 
  PrescriptionStatus, 
  LabOrderStatus, 
  LabPriority, 
  LabInterpretation, 
  InvoiceStatus, 
  InvoiceCategory, 
  PaymentMethod, 
  ConsentType, 
  NotificationChannel, 
  NotificationStatus 
} from '@medicore/shared';

// Interface models
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date | null;
  replacedByToken?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  building?: string | null;
  floor?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorProfileRecord {
  id: string;
  userId: string;
  departmentId: string;
  licenseNumber: string;
  specialization: string;
  consultationFee: number;
  roomNumber?: string | null;
  bio?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorAvailabilityRecord {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDurationMinutes: number;
  timeZone: string;
  isActive: boolean;
}

export interface PatientProfileRecord {
  id: string;
  userId: string;
  mrn: string;
  dateOfBirth: Date;
  gender: string;
  bloodGroup?: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  allergies?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentRecord {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;
  notes?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  checkedInAt?: Date | null;
  priority: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitingListRecord {
  id: string;
  patientId: string;
  doctorId?: string | null;
  departmentId: string;
  preferredDate: Date;
  urgencyLevel: string;
  status: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EncounterRecord {
  id: string;
  encounterNumber: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  startTime: Date;
  endTime?: Date | null;
  status: EncounterStatus;
  type: EncounterType;
  chiefComplaint: string;
  clinicalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VitalSignsRecord {
  id: string;
  encounterId: string;
  patientId: string;
  recordedByUserId: string;
  recordedAt: Date;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  respiratoryRate?: number | null;
  temperature?: number | null;
  oxygenSaturation?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  notes?: string | null;
}

export interface DiagnosisRecord {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  icdCode: string;
  icdDescription: string;
  type: DiagnosisType;
  confidence: string;
  notes?: string | null;
  diagnosedAt: Date;
}

export interface PrescriptionRecord {
  id: string;
  prescriptionNumber: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  status: PrescriptionStatus;
  instructions?: string | null;
  startDate: Date;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrescriptionItemRecord {
  id: string;
  prescriptionId: string;
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  refillsAllowed: number;
  precautions?: string | null;
}

export interface LabOrderRecord {
  id: string;
  orderNumber: string;
  encounterId: string;
  patientId: string;
  orderingDoctorId: string;
  status: LabOrderStatus;
  priority: LabPriority;
  orderDate: Date;
  testPanelName: string;
  clinicalIndication?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabResultRecord {
  id: string;
  labOrderId: string;
  patientId: string;
  technicianUserId?: string | null;
  validatedByUserId?: string | null;
  testName: string;
  testCode: string;
  measuredValue: string;
  unit: string;
  referenceRangeLow?: string | null;
  referenceRangeHigh?: string | null;
  interpretation: LabInterpretation;
  status: string;
  specimenType: string;
  remarks?: string | null;
  completedAt: Date;
  validatedAt?: Date | null;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  patientId: string;
  encounterId?: string | null;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  issuedAt: Date;
  dueDate?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItemRecord {
  id: string;
  invoiceId: string;
  description: string;
  category: InvoiceCategory;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  patientId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  transactionReference?: string | null;
  status: string;
  paymentDate: Date;
}

export interface ConsentRecordModel {
  id: string;
  patientId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedToRole?: UserRole | null;
  grantedToUserId?: string | null;
  grantedAt: Date;
  revokedAt?: Date | null;
  revocationReason?: string | null;
  expiresAt?: Date | null;
  ipAddress?: string | null;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entityName: string;
  entityId?: string | null;
  performedByUserId: string;
  userRole: UserRole;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string | null;
  timestamp: Date;
  requestCorrelationId?: string | null;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: Date | null;
  readAt?: Date | null;
  metadata?: string | null;
  createdAt: Date;
}

// In-Memory Database Store with Transaction Mutex
class MediCoreStore {
  public users: UserRecord[] = [];
  public refreshTokens: RefreshTokenRecord[] = [];
  public departments: DepartmentRecord[] = [];
  public doctors: DoctorProfileRecord[] = [];
  public availabilities: DoctorAvailabilityRecord[] = [];
  public patients: PatientProfileRecord[] = [];
  public appointments: AppointmentRecord[] = [];
  public waitingList: WaitingListRecord[] = [];
  public encounters: EncounterRecord[] = [];
  public vitalSigns: VitalSignsRecord[] = [];
  public diagnoses: DiagnosisRecord[] = [];
  public prescriptions: PrescriptionRecord[] = [];
  public prescriptionItems: PrescriptionItemRecord[] = [];
  public labOrders: LabOrderRecord[] = [];
  public labResults: LabResultRecord[] = [];
  public invoices: InvoiceRecord[] = [];
  public invoiceItems: InvoiceItemRecord[] = [];
  public payments: PaymentRecord[] = [];
  public consents: ConsentRecordModel[] = [];
  public auditLogs: AuditLogRecord[] = [];
  public notifications: NotificationRecord[] = [];

  private mutex: Promise<void> = Promise.resolve();

  // Concurrency-safe transaction runner
  public async runTransaction<T>(action: () => Promise<T>): Promise<T> {
    let unlock: () => void;
    const nextMutex = new Promise<void>((resolve) => {
      unlock = resolve;
    });

    const currentMutex = this.mutex;
    this.mutex = currentMutex.then(() => nextMutex);

    await currentMutex;
    try {
      return await action();
    } finally {
      unlock!();
    }
  }

  // Clear all data (useful for test resets)
  public clearAll() {
    this.users = [];
    this.refreshTokens = [];
    this.departments = [];
    this.doctors = [];
    this.availabilities = [];
    this.patients = [];
    this.appointments = [];
    this.waitingList = [];
    this.encounters = [];
    this.vitalSigns = [];
    this.diagnoses = [];
    this.prescriptions = [];
    this.prescriptionItems = [];
    this.labOrders = [];
    this.labResults = [];
    this.invoices = [];
    this.invoiceItems = [];
    this.payments = [];
    this.consents = [];
    this.auditLogs = [];
    this.notifications = [];
  }
}

export const store = new MediCoreStore();

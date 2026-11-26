import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  CreateEncounterSchema, 
  RecordVitalsSchema, 
  AddDiagnosisSchema, 
  EncounterStatus, 
  AppointmentStatus,
  UserRole, 
  ApiResponse 
} from '@medicore/shared';

export const startEncounter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateEncounterSchema.parse(req.body);

    const apt = store.appointments.find(a => a.id === validated.appointmentId);
    if (!apt) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    // Check existing encounter
    const existing = store.encounters.find(e => e.appointmentId === validated.appointmentId);
    if (existing) {
      throw new AppError('An encounter already exists for this appointment', 409, 'ENCOUNTER_EXISTS');
    }

    const doctorId = req.user?.doctorProfileId || apt.doctorId;
    const now = new Date();

    const enc = {
      id: uuidv4(),
      encounterNumber: `ENC-2026-${(store.encounters.length + 100).toString()}`,
      appointmentId: validated.appointmentId,
      patientId: validated.patientId,
      doctorId,
      startTime: now,
      endTime: null,
      status: EncounterStatus.IN_PROGRESS,
      type: validated.type,
      chiefComplaint: validated.chiefComplaint,
      clinicalNotes: validated.clinicalNotes || null,
      createdAt: now,
      updatedAt: now
    };

    store.encounters.push(enc);
    apt.status = AppointmentStatus.IN_PROGRESS;
    apt.updatedAt = now;

    recordAuditLog(req, 'START_ENCOUNTER', 'Encounter', enc.id, {
      encounterNumber: enc.encounterNumber,
      patientId: validated.patientId
    });

    const response: ApiResponse<typeof enc> = {
      success: true,
      data: enc,
      meta: {
        requestId: req.correlationId,
        timestamp: now.toISOString()
      }
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const getEncounterById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const enc = store.encounters.find(e => e.id === id);
    if (!enc) {
      throw new AppError('Encounter not found', 404, 'NOT_FOUND');
    }

    if (req.user?.role === UserRole.PATIENT && req.user.patientProfileId !== enc.patientId) {
      throw new AppError('Access denied: You can only view your own encounters', 403, 'FORBIDDEN');
    }

    const patient = store.patients.find(p => p.id === enc.patientId);
    const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
    const doctor = store.doctors.find(d => d.id === enc.doctorId);
    const doctorUser = doctor ? store.users.find(u => u.id === doctor.userId) : null;
    const vitals = store.vitalSigns.filter(v => v.encounterId === id);
    const diagnoses = store.diagnoses.filter(d => d.encounterId === id);
    const prescriptions = store.prescriptions.filter(p => p.encounterId === id);
    const labOrders = store.labOrders.filter(l => l.encounterId === id);

    const fullEnc = {
      ...enc,
      patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown Patient',
      patientMrn: patient?.mrn,
      doctorName: doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Dr. Specialist',
      vitals,
      diagnoses,
      prescriptions,
      labOrders
    };

    recordAuditLog(req, 'VIEW_ENCOUNTER_DETAILS', 'Encounter', id);

    const response: ApiResponse<typeof fullEnc> = {
      success: true,
      data: fullEnc,
      meta: {
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const completeEncounter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { clinicalNotes } = req.body;

    const enc = store.encounters.find(e => e.id === id);
    if (!enc) {
      throw new AppError('Encounter not found', 404, 'NOT_FOUND');
    }

    const now = new Date();
    enc.status = EncounterStatus.COMPLETED;
    enc.endTime = now;
    if (clinicalNotes) {
      enc.clinicalNotes = clinicalNotes;
    }
    enc.updatedAt = now;

    // Update parent appointment
    const apt = store.appointments.find(a => a.id === enc.appointmentId);
    if (apt) {
      apt.status = AppointmentStatus.COMPLETED;
      apt.updatedAt = now;
    }

    recordAuditLog(req, 'COMPLETE_ENCOUNTER', 'Encounter', id, {
      encounterNumber: enc.encounterNumber
    });

    const response: ApiResponse<typeof enc> = {
      success: true,
      data: enc,
      meta: {
        requestId: req.correlationId,
        timestamp: now.toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const recordVitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RecordVitalsSchema.parse(req.body);

    const enc = store.encounters.find(e => e.id === validated.encounterId);
    if (!enc) {
      throw new AppError('Encounter not found', 404, 'NOT_FOUND');
    }

    // BMI calculation if height and weight present
    let bmi: number | null = null;
    if (validated.heightCm && validated.weightKg) {
      const heightM = validated.heightCm / 100;
      bmi = parseFloat((validated.weightKg / (heightM * heightM)).toFixed(1));
    }

    const vitalsRecord = {
      id: uuidv4(),
      encounterId: validated.encounterId,
      patientId: validated.patientId,
      recordedByUserId: req.user?.id || 'STAFF',
      recordedAt: new Date(),
      systolicBp: validated.systolicBp,
      diastolicBp: validated.diastolicBp,
      heartRate: validated.heartRate,
      respiratoryRate: validated.respiratoryRate || null,
      temperature: validated.temperature || null,
      oxygenSaturation: validated.oxygenSaturation || null,
      heightCm: validated.heightCm || null,
      weightKg: validated.weightKg || null,
      bmi,
      notes: validated.notes || null
    };

    store.vitalSigns.push(vitalsRecord);
    recordAuditLog(req, 'RECORD_VITALS', 'VitalSigns', vitalsRecord.id, { encounterId: validated.encounterId });

    const response: ApiResponse<typeof vitalsRecord> = {
      success: true,
      data: vitalsRecord,
      meta: {
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const addDiagnosis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = AddDiagnosisSchema.parse(req.body);

    const enc = store.encounters.find(e => e.id === validated.encounterId);
    if (!enc) {
      throw new AppError('Encounter not found', 404, 'NOT_FOUND');
    }

    const diag = {
      id: uuidv4(),
      encounterId: validated.encounterId,
      patientId: validated.patientId,
      doctorId: req.user?.doctorProfileId || enc.doctorId,
      icdCode: validated.icdCode,
      icdDescription: validated.icdDescription,
      type: validated.type,
      confidence: validated.confidence,
      notes: validated.notes || null,
      diagnosedAt: new Date()
    };

    store.diagnoses.push(diag);
    recordAuditLog(req, 'ADD_DIAGNOSIS', 'Diagnosis', diag.id, { icdCode: diag.icdCode });

    const response: ApiResponse<typeof diag> = {
      success: true,
      data: diag,
      meta: {
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

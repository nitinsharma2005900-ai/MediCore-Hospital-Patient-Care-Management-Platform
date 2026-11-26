import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  CreatePrescriptionSchema, 
  PrescriptionStatus, 
  UserRole, 
  ApiResponse 
} from '@medicore/shared';

export const listPrescriptions = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, status } = req.query;

    let prescriptions = [...store.prescriptions];

    if (req.user?.role === UserRole.PATIENT) {
      prescriptions = prescriptions.filter(p => p.patientId === req.user!.patientProfileId);
    } else if (patientId && typeof patientId === 'string') {
      prescriptions = prescriptions.filter(p => p.patientId === patientId);
    }

    if (status && typeof status === 'string') {
      prescriptions = prescriptions.filter(p => p.status === status);
    }

    const results = prescriptions.map(rx => {
      const patient = store.patients.find(p => p.id === rx.patientId);
      const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
      const doctor = store.doctors.find(d => d.id === rx.doctorId);
      const doctorUser = doctor ? store.users.find(u => u.id === doctor.userId) : null;
      const items = store.prescriptionItems.filter(item => item.prescriptionId === rx.id);

      return {
        ...rx,
        patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient',
        patientMrn: patient?.mrn,
        doctorName: doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Dr. Specialist',
        items
      };
    });

    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
      meta: {
        total: results.length,
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const rx = store.prescriptions.find(p => p.id === id);
    if (!rx) {
      throw new AppError('Prescription not found', 404, 'NOT_FOUND');
    }

    if (req.user?.role === UserRole.PATIENT && req.user.patientProfileId !== rx.patientId) {
      throw new AppError('Access denied: Unauthorized prescription access', 403, 'FORBIDDEN');
    }

    const patient = store.patients.find(p => p.id === rx.patientId);
    const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
    const doctor = store.doctors.find(d => d.id === rx.doctorId);
    const doctorUser = doctor ? store.users.find(u => u.id === doctor.userId) : null;
    const items = store.prescriptionItems.filter(item => item.prescriptionId === rx.id);

    const fullRx = {
      ...rx,
      patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient',
      patientMrn: patient?.mrn,
      patientPhone: patientUser?.phone,
      doctorName: doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Dr. Specialist',
      items
    };

    recordAuditLog(req, 'VIEW_PRESCRIPTION', 'Prescription', id);

    const response: ApiResponse<typeof fullRx> = {
      success: true,
      data: fullRx,
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

export const createPrescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreatePrescriptionSchema.parse(req.body);

    const enc = store.encounters.find(e => e.id === validated.encounterId);
    if (!enc) {
      throw new AppError('Encounter not found', 404, 'NOT_FOUND');
    }

    const doctorId = req.user?.doctorProfileId || enc.doctorId;
    const now = new Date();

    const rxId = uuidv4();
    const rx = {
      id: rxId,
      prescriptionNumber: `RX-2026-${(store.prescriptions.length + 5000).toString()}`,
      encounterId: validated.encounterId,
      patientId: validated.patientId,
      doctorId,
      status: PrescriptionStatus.ACTIVE,
      instructions: validated.instructions || 'Take medications as directed by clinician.',
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 86400000),
      createdAt: now,
      updatedAt: now
    };
    store.prescriptions.push(rx);

    const items = validated.items.map(item => {
      const itemRecord = {
        id: uuidv4(),
        prescriptionId: rxId,
        medicationName: item.medicationName,
        dosage: item.dosage,
        route: item.route,
        frequency: item.frequency,
        durationDays: item.durationDays,
        quantity: item.quantity,
        refillsAllowed: item.refillsAllowed,
        precautions: item.precautions || null
      };
      store.prescriptionItems.push(itemRecord);
      return itemRecord;
    });

    recordAuditLog(req, 'CREATE_PRESCRIPTION', 'Prescription', rxId, {
      prescriptionNumber: rx.prescriptionNumber,
      itemCount: items.length
    });

    const response: ApiResponse<{ prescription: typeof rx; items: typeof items }> = {
      success: true,
      data: { prescription: rx, items },
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

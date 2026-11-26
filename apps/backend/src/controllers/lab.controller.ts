import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  CreateLabOrderSchema, 
  EnterLabResultSchema, 
  LabOrderStatus, 
  UserRole, 
  ApiResponse 
} from '@medicore/shared';

export const listLabOrders = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, patientId } = req.query;

    let orders = [...store.labOrders];

    if (req.user?.role === UserRole.PATIENT) {
      orders = orders.filter(o => o.patientId === req.user!.patientProfileId);
    } else if (patientId && typeof patientId === 'string') {
      orders = orders.filter(o => o.patientId === patientId);
    }

    if (status && typeof status === 'string') {
      orders = orders.filter(o => o.status === status);
    }

    // Sort by orderDate descending
    orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());

    const results = orders.map(ord => {
      const patient = store.patients.find(p => p.id === ord.patientId);
      const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
      const doctor = store.doctors.find(d => d.id === ord.orderingDoctorId);
      const doctorUser = doctor ? store.users.find(u => u.id === doctor.userId) : null;
      const resultsList = store.labResults.filter(r => r.labOrderId === ord.id);

      return {
        ...ord,
        patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient',
        patientMrn: patient?.mrn,
        doctorName: doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Dr. Specialist',
        resultsCount: resultsList.length,
        results: resultsList
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

export const getLabOrderById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = store.labOrders.find(o => o.id === id);
    if (!order) {
      throw new AppError('Laboratory order not found', 404, 'NOT_FOUND');
    }

    if (req.user?.role === UserRole.PATIENT && req.user.patientProfileId !== order.patientId) {
      throw new AppError('Access denied: Unauthorized lab order access', 403, 'FORBIDDEN');
    }

    const patient = store.patients.find(p => p.id === order.patientId);
    const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
    const doctor = store.doctors.find(d => d.id === order.orderingDoctorId);
    const doctorUser = doctor ? store.users.find(u => u.id === doctor.userId) : null;
    const results = store.labResults.filter(r => r.labOrderId === id);

    const fullOrder = {
      ...order,
      patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient',
      patientMrn: patient?.mrn,
      doctorName: doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Dr. Specialist',
      results
    };

    recordAuditLog(req, 'VIEW_LAB_ORDER', 'LabOrder', id);

    const response: ApiResponse<typeof fullOrder> = {
      success: true,
      data: fullOrder,
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

export const createLabOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateLabOrderSchema.parse(req.body);

    const enc = store.encounters.find(e => e.id === validated.encounterId);
    if (!enc) {
      throw new AppError('Encounter not found', 404, 'NOT_FOUND');
    }

    const doctorId = req.user?.doctorProfileId || enc.doctorId;
    const now = new Date();

    const order = {
      id: uuidv4(),
      orderNumber: `LAB-2026-${(store.labOrders.length + 3000).toString()}`,
      encounterId: validated.encounterId,
      patientId: validated.patientId,
      orderingDoctorId: doctorId,
      status: LabOrderStatus.PENDING,
      priority: validated.priority,
      orderDate: now,
      testPanelName: validated.testPanelName,
      clinicalIndication: validated.clinicalIndication || null,
      createdAt: now,
      updatedAt: now
    };

    store.labOrders.push(order);
    recordAuditLog(req, 'CREATE_LAB_ORDER', 'LabOrder', order.id, { testPanelName: order.testPanelName });

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
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

export const enterLabResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = EnterLabResultSchema.parse(req.body);

    const order = store.labOrders.find(o => o.id === validated.labOrderId);
    if (!order) {
      throw new AppError('Associated Lab order not found', 404, 'NOT_FOUND');
    }

    // Safety check: ensure result belongs to correct patient
    if (order.patientId !== validated.patientId) {
      throw new AppError(
        'Patient mismatch: Lab result patient does not match order patient record.',
        400,
        'PATIENT_MISMATCH'
      );
    }

    const now = new Date();
    const result = {
      id: uuidv4(),
      labOrderId: validated.labOrderId,
      patientId: validated.patientId,
      technicianUserId: req.user?.id || null,
      validatedByUserId: null,
      testName: validated.testName,
      testCode: validated.testCode,
      measuredValue: validated.measuredValue,
      unit: validated.unit,
      referenceRangeLow: validated.referenceRangeLow || null,
      referenceRangeHigh: validated.referenceRangeHigh || null,
      interpretation: validated.interpretation,
      status: 'PRELIMINARY',
      specimenType: validated.specimenType,
      remarks: validated.remarks || null,
      completedAt: now,
      validatedAt: null
    };

    store.labResults.push(result);
    order.status = LabOrderStatus.IN_ANALYSIS;
    order.updatedAt = now;

    recordAuditLog(req, 'ENTER_LAB_RESULT', 'LabResult', result.id, {
      testCode: result.testCode,
      measuredValue: result.measuredValue
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
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

export const validateLabResult = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = store.labResults.find(r => r.id === id);
    if (!result) {
      throw new AppError('Lab result not found', 404, 'NOT_FOUND');
    }

    const now = new Date();
    result.status = 'FINAL';
    result.validatedByUserId = req.user?.id || 'DOCTOR';
    result.validatedAt = now;

    // Check if all results for order are final, then set order to COMPLETED
    const allResults = store.labResults.filter(r => r.labOrderId === result.labOrderId);
    const allFinal = allResults.every(r => r.status === 'FINAL');
    if (allFinal) {
      const order = store.labOrders.find(o => o.id === result.labOrderId);
      if (order) {
        order.status = LabOrderStatus.COMPLETED;
        order.updatedAt = now;
      }
    }

    recordAuditLog(req, 'VALIDATE_LAB_RESULT', 'LabResult', id, { status: 'FINAL' });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
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

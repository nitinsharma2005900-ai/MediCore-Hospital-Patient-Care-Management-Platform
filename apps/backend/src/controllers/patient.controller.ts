import { canAccessClinical } from '../middlewares/scope.middleware';
import { Request, Response, NextFunction } from 'express';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { ApiResponse, UserRole } from '@medicore/shared';
import { recordAuditLog } from '../middlewares/audit.middleware';

export const listPatients = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let patients = store.patients.filter(p => [UserRole.RECEPTIONIST, UserRole.BILLING_OFFICER, UserRole.ADMIN].includes(req.user!.role) || canAccessClinical(req, p.id)).map(p => {
      const user = store.users.find(u => u.id === p.userId);
      return {
        id: p.id, mrn: p.mrn, userId: p.userId,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown Patient',
        email: user?.email || '',
        phone: user?.phone || ''
      };
    });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      patients = patients.filter(
        p => p.name.toLowerCase().includes(q) || 
             p.mrn.toLowerCase().includes(q) || 
             p.email.toLowerCase().includes(q)
      );
    }

    const total = patients.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = patients.slice(startIndex, startIndex + limitNum);

    recordAuditLog(req, 'LIST_PATIENTS', 'PatientProfile', null, { count: paginated.length, total });

    const response: ApiResponse<typeof paginated> = {
      success: true,
      data: paginated,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getPatientById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const p = store.patients.find(pt => pt.id === id);
    if (!p) {
      throw new AppError('Patient profile not found', 404, 'NOT_FOUND');
    }

    // Role check: If Patient, can only view own profile
    if (req.user?.role === UserRole.PATIENT && req.user.patientProfileId !== id) {
      throw new AppError('Access denied: You may only view your own patient profile', 403, 'FORBIDDEN');
    }

    const user = store.users.find(u => u.id === p.userId);
    const appointments = store.appointments.filter(a => a.patientId === id);
    const encounters = store.encounters.filter(e => e.patientId === id);
    const prescriptions = store.prescriptions.filter(rx => rx.patientId === id);
    const labOrders = store.labOrders.filter(l => l.patientId === id);
    const consents = store.consents.filter(c => c.patientId === id);
    const invoices = store.invoices.filter(inv => inv.patientId === id);

    const fullProfile = {
      ...p,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      phone: user?.phone,
      appointmentsCount: appointments.length,
      encountersCount: encounters.length,
      prescriptionsCount: prescriptions.length,
      labOrdersCount: labOrders.length,
      consents,
      recentAppointments: appointments.slice(-5),
      recentEncounters: encounters.slice(-5),
      recentInvoices: invoices.slice(-5)
    };

    recordAuditLog(req, 'VIEW_PATIENT_CHART', 'PatientProfile', id, { mrn: p.mrn });

    const response: ApiResponse<typeof fullProfile> = {
      success: true,
      data: fullProfile,
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

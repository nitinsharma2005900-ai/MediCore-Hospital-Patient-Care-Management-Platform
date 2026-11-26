import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../database/store';
import { validateSlot } from '../services/availability';
import { z } from 'zod';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  CreateAppointmentSchema, 
  RescheduleAppointmentSchema, 
  CancelAppointmentSchema, 
  AppointmentStatus, 
  UserRole, 
  ApiResponse,
  NotificationChannel,
  NotificationStatus
} from '@medicore/shared';

export const listAppointments = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, doctorId, patientId, date, page = '1', limit = '25' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let apts = [...store.appointments];

    // Role-based visibility
    if (req.user?.role === UserRole.PATIENT) {
      apts = apts.filter(a => a.patientId === req.user!.patientProfileId);
    } else if (req.user?.role === UserRole.DOCTOR) {
      apts = apts.filter(a => a.doctorId === req.user!.doctorProfileId);
    }
    if (req.user?.role === UserRole.NURSE) apts = apts.filter(a => store.careAssignments.some(c => c.patientId === a.patientId && c.nurseUserId === req.user!.id && c.active));

    if (status && typeof status === 'string') {
      apts = apts.filter(a => a.status === status);
    }

    if (doctorId && typeof doctorId === 'string') {
      apts = apts.filter(a => a.doctorId === doctorId);
    }

    if (patientId && typeof patientId === 'string') {
      apts = apts.filter(a => a.patientId === patientId);
    }

    if (date && typeof date === 'string') {
      apts = apts.filter(a => a.scheduledStartTime.toISOString().startsWith(date));
    }

    // Sort by scheduled start time descending
    apts.sort((a, b) => b.scheduledStartTime.getTime() - a.scheduledStartTime.getTime());

    const total = apts.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = apts.slice(startIndex, startIndex + limitNum).map(apt => {
      const patient = store.patients.find(p => p.id === apt.patientId);
      const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
      const doctor = store.doctors.find(d => d.id === apt.doctorId);
      const doctorUser = doctor ? store.users.find(u => u.id === doctor.userId) : null;
      const dept = store.departments.find(dp => dp.id === apt.departmentId);

      return {
        ...apt,
        encounterId: store.encounters.find(e => e.appointmentId === apt.id)?.id,
        reason: req.user?.role === UserRole.ADMIN ? 'Operational appointment' : apt.reason,
        notes: req.user?.role === UserRole.ADMIN ? null : apt.notes,
        patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown Patient',
        patientMrn: patient?.mrn || 'N/A',
        doctorName: doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Dr. Specialist',
        doctorSpecialization: doctor?.specialization || 'Clinical Specialist',
        departmentName: dept?.name || 'Department'
      };
    });

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

export const getAppointmentById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const apt = store.appointments.find(a => a.id === id);
    if (!apt) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    if (req.user?.role === UserRole.PATIENT && req.user.patientProfileId !== apt.patientId) {
      throw new AppError('Access denied: Unauthorized appointment view', 403, 'FORBIDDEN');
    }

    const patient = store.patients.find(p => p.id === apt.patientId);
    const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
    const doctor = store.doctors.find(d => d.id === apt.doctorId);
    const doctorUser = doctor ? store.users.find(u => u.id === doctor.userId) : null;
    const dept = store.departments.find(dp => dp.id === apt.departmentId);
    const encounter = store.encounters.find(e => e.appointmentId === apt.id);

    const fullApt = {
      ...apt,
      patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Unknown Patient',
      patientMrn: patient?.mrn,
      patientPhone: patientUser?.phone,
      doctorName: doctorUser ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}` : 'Dr. Specialist',
      doctorSpecialization: doctor?.specialization,
      departmentName: dept?.name,
      encounterId: encounter?.id,
      encounterStatus: encounter?.status
    };

    const response: ApiResponse<typeof fullApt> = {
      success: true,
      data: fullApt,
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

/**
 * Book Appointment with Transactional Concurrency Lock (Assessment 07 & 12)
 * Guarantees no double-booking can ever occur even under concurrent load.
 */
export const bookAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateAppointmentSchema.parse(req.body);

    let patientId = validated.patientId;
    if (req.user?.role === UserRole.PATIENT) {
      patientId = req.user.patientProfileId;
    }

    if (!patientId) {
      throw new AppError('Patient ID is required to book an appointment', 400, 'PATIENT_REQUIRED');
    }

    const doctor = store.doctors.find(d => d.id === validated.doctorId);
    if (!doctor || !doctor.isActive) {
      throw new AppError('Requested doctor is not available or inactive', 404, 'DOCTOR_NOT_FOUND');
    }

    const startTime = new Date(validated.scheduledStartTime);
    const endTime = new Date(validated.scheduledEndTime);

    if (endTime <= startTime) {
      throw new AppError('Scheduled end time must be after start time', 400, 'INVALID_TIME_RANGE');
    }

    // Execute within Transaction Lock
    const createdAppointment = await store.runTransaction(async () => {
      // 1. Concurrency Check: Check for overlapping appointments for this doctor
      const conflictingAppointment = store.appointments.find(a => {
        if (a.doctorId !== validated.doctorId) return false;
        if (a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW) return false;

        const aStart = a.scheduledStartTime.getTime();
        const aEnd = a.scheduledEndTime.getTime();
        const reqStart = startTime.getTime();
        const reqEnd = endTime.getTime();

        // Overlap formula: (reqStart < aEnd && reqEnd > aStart)
        return reqStart < aEnd && reqEnd > aStart;
      });

      if (conflictingAppointment) {
        throw new AppError(
          'Booking conflict: The requested doctor already has a confirmed appointment during this time slot.',
          409,
          'APPOINTMENT_CONFLICT'
        );
      }

      validateSlot(validated.doctorId, startTime, endTime, validated.departmentId);
      if (!store.patients.some(p => p.id === patientId)) throw new AppError('Patient not found', 404, 'NOT_FOUND');
      // 2. Insert Appointment
      const now = new Date();
      const newApt = {
        id: uuidv4(),
        appointmentNumber: `APT-2026-${(store.appointments.length + 1000).toString()}`,
        patientId,
        doctorId: validated.doctorId,
        departmentId: validated.departmentId,
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        status: AppointmentStatus.CONFIRMED,
        type: validated.type,
        reason: validated.reason,
        notes: validated.notes || null,
        cancellationReason: null,
        cancelledAt: null,
        cancelledBy: null,
        checkedInAt: null,
        priority: validated.priority,
        version: 1,
        createdAt: now,
        updatedAt: now
      };

      store.appointments.push(newApt);
      return newApt;
    });

    // Send notifications to Patient
    const patient = store.patients.find(p => p.id === patientId);
    if (patient) {
      for (const channel of [NotificationChannel.EMAIL, NotificationChannel.SMS]) store.notifications.push({
        id: uuidv4(), userId: patient.userId, title: 'Appointment reserved',
        message: 'Your appointment is reserved. Sign in to review the details.', channel,
        status: NotificationStatus.PENDING, createdAt: new Date(), metadata: JSON.stringify({ appointmentId: createdAppointment.id, provider: 'LOCAL_SIMULATOR' })
      });
      store.notifications.push({
        id: uuidv4(),
        userId: patient.userId,
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. is confirmed for ${startTime.toUTCString()}.`,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        readAt: null,
        metadata: JSON.stringify({ appointmentId: createdAppointment.id }),
        createdAt: new Date()
      });
    }

    recordAuditLog(req, 'BOOK_APPOINTMENT', 'Appointment', createdAppointment.id, {
      appointmentNumber: createdAppointment.appointmentNumber,
      doctorId: validated.doctorId,
      startTime: startTime.toISOString()
    });

    const response: ApiResponse<typeof createdAppointment> = {
      success: true,
      data: createdAppointment,
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

export const checkInAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const apt = store.appointments.find(a => a.id === id);
    if (!apt) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    if (![AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED].includes(apt.status)) {
      throw new AppError('Only a requested or confirmed appointment can be checked in', 400, 'INVALID_STATUS');
    }

    apt.status = AppointmentStatus.CHECKED_IN;
    apt.checkedInAt = new Date();
    apt.updatedAt = new Date();

    recordAuditLog(req, 'CHECK_IN_PATIENT', 'Appointment', id, {
      appointmentNumber: apt.appointmentNumber,
      checkedInAt: apt.checkedInAt.toISOString()
    });

    const response: ApiResponse<typeof apt> = {
      success: true,
      data: apt,
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

export const rescheduleAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validated = RescheduleAppointmentSchema.parse(req.body);

    const apt = store.appointments.find(a => a.id === id);
    if (!apt) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    if (![AppointmentStatus.REQUESTED,AppointmentStatus.CONFIRMED,AppointmentStatus.CHECKED_IN].includes(apt.status)) {
      throw new AppError(`Cannot reschedule an appointment in status ${apt.status}`, 400, 'INVALID_STATUS');
    }

    const newStart = new Date(validated.newStartTime);
    const newEnd = new Date(validated.newEndTime);

    await store.runTransaction(async () => {
      const conflict = store.appointments.find(a => {
        if (a.id === id) return false;
        if (a.doctorId !== apt.doctorId) return false;
        if (a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.NO_SHOW) return false;

        const aStart = a.scheduledStartTime.getTime();
        const aEnd = a.scheduledEndTime.getTime();
        const reqStart = newStart.getTime();
        const reqEnd = newEnd.getTime();
        return reqStart < aEnd && reqEnd > aStart;
      });

      if (conflict) {
        throw new AppError('Reschedule conflict: Target time slot is already booked for this doctor.', 409, 'APPOINTMENT_CONFLICT');
      }

      validateSlot(apt.doctorId, newStart, newEnd, apt.departmentId);
      apt.scheduledStartTime = newStart;
      apt.scheduledEndTime = newEnd;
      apt.status = AppointmentStatus.CONFIRMED;
      apt.notes = `${apt.notes || ''} [Rescheduled: ${validated.reason}]`.trim();
      apt.version += 1;
      apt.updatedAt = new Date();
    });

    recordAuditLog(req, 'RESCHEDULE_APPOINTMENT', 'Appointment', id, {
      newStartTime: newStart.toISOString(),
      reason: validated.reason
    });

    const response: ApiResponse<typeof apt> = {
      success: true,
      data: apt,
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

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validated = CancelAppointmentSchema.parse(req.body);

    const apt = store.appointments.find(a => a.id === id);
    if (!apt) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    if (![AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN].includes(apt.status)) {
      throw new AppError('Cannot cancel a completed appointment', 400, 'ALREADY_COMPLETED');
    }

    apt.status = AppointmentStatus.CANCELLED;
    apt.cancellationReason = validated.cancellationReason;
    apt.cancelledAt = new Date();
    apt.cancelledBy = req.user?.id || 'SYSTEM';
    apt.updatedAt = new Date();

    recordAuditLog(req, 'CANCEL_APPOINTMENT', 'Appointment', id, {
      cancellationReason: validated.cancellationReason
    });

    const response: ApiResponse<typeof apt> = {
      success: true,
      data: apt,
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

export const listWaitingList = (req: Request, res: Response, next: NextFunction) => {
  try {
    const waitingList = req.user?.role === UserRole.PATIENT ? store.waitingList.filter(w => w.patientId === req.user?.patientProfileId) : store.waitingList;
    const response: ApiResponse<typeof waitingList> = {
      success: true,
      data: waitingList,
      meta: {
        total: waitingList.length,
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const addToWaitingList = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, doctorId, departmentId, preferredDate, urgencyLevel, notes } = z.object({
      patientId: z.string().uuid().optional(), doctorId: z.string().uuid().optional(), departmentId: z.string().uuid(),
      preferredDate: z.string().date(), urgencyLevel: z.enum(['LOW','MEDIUM','HIGH']).default('MEDIUM'), notes: z.string().max(500).optional()
    }).parse(req.body);
    const targetPatientId = req.user?.role === UserRole.PATIENT ? req.user.patientProfileId : patientId;
    if (!targetPatientId || !store.patients.some(p => p.id === targetPatientId)) throw new AppError('Valid patient required', 400, 'PATIENT_REQUIRED');
    const entry = {
      id: uuidv4(),
      patientId: targetPatientId,
      doctorId: doctorId || null,
      departmentId,
      preferredDate: new Date(preferredDate),
      urgencyLevel: urgencyLevel || 'MEDIUM',
      status: 'PENDING',
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.waitingList.push(entry);

    recordAuditLog(req, 'ADD_WAITING_LIST', 'WaitingList', entry.id);

    const response: ApiResponse<typeof entry> = {
      success: true,
      data: entry,
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

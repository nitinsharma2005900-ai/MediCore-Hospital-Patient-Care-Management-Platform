import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@medicore/shared';
import { AppError } from './error.middleware';
import { store } from '../database/store';

/**
 * Record-Level Authorization & Anti-IDOR Check:
 * Ensures patients can only access their own clinical resources.
 * If patientIdParam is passed, validates against req.user.patientProfileId.
 */
export const requirePatientSelfOrClinicalStaff = (patientIdParam = 'patientId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthenticated request', 401, 'UNAUTHORIZED'));
    }

    const targetPatientId = req.params[patientIdParam] || req.body[patientIdParam] || (req.query[patientIdParam] as string);

    // Clinical staff roles with clinical rights
    const clinicalRoles: UserRole[] = [
      UserRole.DOCTOR, 
      UserRole.NURSE, 
      UserRole.LAB_TECHNICIAN, 
      UserRole.RECEPTIONIST, 
      UserRole.ADMIN
    ];

    if (req.user.role === UserRole.PATIENT) {
      if (!req.user.patientProfileId || req.user.patientProfileId !== targetPatientId) {
        return next(
          new AppError(
            'Access denied: You are only authorized to access your own medical records.',
            403,
            'CROSS_PATIENT_ACCESS_FORBIDDEN'
          )
        );
      }
    } else if (!clinicalRoles.includes(req.user.role)) {
      return next(
        new AppError('Access forbidden: Insufficient authorization level', 403, 'FORBIDDEN')
      );
    }

    next();
  };
};

/**
 * Doctor-Specific Record Level Authorization:
 * Confirms doctor is modifying their own encounter, prescription, or availability.
 */
export const requireAssignedDoctorOrAdmin = (doctorIdParam = 'doctorId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthenticated request', 401, 'UNAUTHORIZED'));
    }

    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    const targetDoctorId = req.params[doctorIdParam] || req.body[doctorIdParam];
    if (req.user.role === UserRole.DOCTOR) {
      if (!req.user.doctorProfileId || (targetDoctorId && req.user.doctorProfileId !== targetDoctorId)) {
        return next(
          new AppError('Access denied: You can only act on behalf of your assigned clinician profile.', 403, 'DOCTOR_MISMATCH')
        );
      }
    }

    next();
  };
};

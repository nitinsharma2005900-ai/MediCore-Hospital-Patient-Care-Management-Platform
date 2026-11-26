import { Request, Response, NextFunction } from 'express';
import { ConsentType, UserRole } from '@medicore/shared';
import { store } from '../database/store';
import { AppError } from './error.middleware';

/**
 * Validates that active, unrevoked consent exists for the patient before releasing or sharing sensitive records.
 */
export const requireActiveConsent = (consentType: ConsentType, patientIdParam = 'patientId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Patients accessing their own records do not require separate third-party consent checks
    if (req.user?.role === UserRole.PATIENT) {
      return next();
    }

    const patientId = req.params[patientIdParam] || req.body[patientIdParam] || (req.query[patientIdParam] as string);
    if (!patientId) {
      return next();
    }

    const activeConsent = store.consents.find(c => 
      c.patientId === patientId && 
      c.consentType === consentType && 
      c.granted && 
      !c.revokedAt &&
      (!c.expiresAt || c.expiresAt > new Date())
    );

    if (!activeConsent) {
      return next(
        new AppError(
          `Action blocked: No active patient consent granted for '${consentType}'.`,
          403,
          'CONSENT_REQUIRED_OR_REVOKED'
        )
      );
    }

    next();
  };
};

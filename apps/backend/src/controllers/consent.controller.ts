import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  UpdateConsentSchema, 
  UserRole, 
  ApiResponse 
} from '@medicore/shared';

export const getPatientConsents = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    if (req.user?.role !== UserRole.PATIENT || req.user.patientProfileId !== patientId) throw new AppError('Only the patient may read or change consent', 403, 'FORBIDDEN');

    if (req.user?.role === UserRole.PATIENT && req.user.patientProfileId !== patientId) {
      throw new AppError('Access denied: Unauthorized consent access', 403, 'FORBIDDEN');
    }

    const consents = store.consents.filter(c => c.patientId === patientId);

    const response: ApiResponse<typeof consents> = {
      success: true,
      data: consents,
      meta: {
        total: consents.length,
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const updateConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    if (req.user?.role !== UserRole.PATIENT || req.user.patientProfileId !== patientId) throw new AppError('Only the patient may read or change consent', 403, 'FORBIDDEN');
    const validated = UpdateConsentSchema.parse(req.body);

    if (req.user?.role === UserRole.PATIENT && req.user.patientProfileId !== patientId) {
      throw new AppError('Access denied: You can only manage your own consent preferences', 403, 'FORBIDDEN');
    }

    const patient = store.patients.find(p => p.id === patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404, 'NOT_FOUND');
    }

    const existing = store.consents.find(c => c.patientId === patientId && c.consentType === validated.consentType);
    const now = new Date();

    let record;
    if (existing) {
      existing.granted = validated.granted;
      existing.grantedToRole = validated.grantedToRole || null;
      existing.grantedToUserId = validated.grantedToUserId || null;
      if (!validated.granted) {
        existing.revokedAt = now;
        existing.revocationReason = validated.revocationReason || 'Patient explicitly revoked consent';
      } else {
        existing.grantedAt = now;
        existing.revokedAt = null;
        existing.revocationReason = null;
      }
      record = existing;
    } else {
      record = {
        id: uuidv4(),
        patientId,
        consentType: validated.consentType,
        granted: validated.granted,
        grantedToRole: validated.grantedToRole || null,
        grantedToUserId: validated.grantedToUserId || null,
        grantedAt: now,
        revokedAt: validated.granted ? null : now,
        revocationReason: validated.granted ? null : (validated.revocationReason || 'Consent denied'),
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : new Date(now.getTime() + 365 * 86400000),
        ipAddress: req.ip || null
      };
      store.consents.push(record);
    }

    recordAuditLog(req, 'UPDATE_CONSENT', 'ConsentRecord', record.id, {
      consentType: validated.consentType,
      granted: validated.granted,
      revocationReason: record.revocationReason
    });

    const response: ApiResponse<typeof record> = {
      success: true,
      data: record,
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

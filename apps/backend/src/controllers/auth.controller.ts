import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  LoginSchema, 
  RegisterPatientSchema, 
  UserRole, 
  ConsentType, 
  ApiResponse,
  AuthTokens,
  UserSummary
} from '@medicore/shared';

function generateTokens(user: { id: string; role: UserRole; email: string }): AuthTokens {
  const accessTokenId = uuidv4();
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, email: user.email, jti: accessTokenId },
    config.jwt.accessSecret,
    { expiresIn: '15m' as any }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, tokenUuid: uuidv4() },
    config.jwt.refreshSecret,
    { expiresIn: '7d' as any }
  );

  store.refreshTokens.push({
    id: uuidv4(), userId: user.id, accessTokenId,
    tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 86400000), revoked: false, createdAt: new Date()
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60 // 15 minutes
  };
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const user = store.users.find(u => u.email.toLowerCase() === validated.email.toLowerCase());

    if (!user) {
      throw new AppError('Invalid email or password combination', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is inactive. Please contact administration.', 403, 'ACCOUNT_INACTIVE');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      throw new AppError(`Account locked due to consecutive failed attempts. Try again in ${waitSeconds}s.`, 403, 'ACCOUNT_LOCKED');
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60000); // 15 min lockout
        recordAuditLog(req, 'ACCOUNT_LOCKOUT', 'User', user.id, { reason: '5 consecutive failed logins' });
      }
      throw new AppError('Invalid email or password combination', 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed counter
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    req.user = { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName };
    const tokens = generateTokens(user);

    const patientProfile = store.patients.find(p => p.userId === user.id);
    const doctorProfile = store.doctors.find(d => d.userId === user.id);

    const userSummary: UserSummary = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      patientProfileId: patientProfile?.id,
      doctorProfileId: doctorProfile?.id
    };

    recordAuditLog(req, 'LOGIN_SUCCESS', 'User', user.id, { role: user.role });

    const response: ApiResponse<{ user: UserSummary; tokens: AuthTokens }> = {
      success: true,
      data: {
        user: userSummary,
        tokens
      },
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

export const registerPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterPatientSchema.parse(req.body);
    const existing = store.users.find(u => u.email.toLowerCase() === validated.email.toLowerCase());

    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);
    const userId = uuidv4();
    const patientProfileId = uuidv4();
    const mrn = `MRN-2026-${(store.patients.length + 1).toString().padStart(4, '0')}`;
    const now = new Date();

    const newUser = {
      id: userId,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: UserRole.PATIENT,
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now
    };
    store.users.push(newUser);

    const newPatientProfile = {
      id: patientProfileId,
      userId,
      mrn,
      dateOfBirth: new Date(validated.dateOfBirth),
      gender: validated.gender,
      bloodGroup: validated.bloodGroup || null,
      emergencyContactName: validated.emergencyContactName,
      emergencyContactPhone: validated.emergencyContactPhone,
      address: validated.address,
      insuranceProvider: validated.insuranceProvider || null,
      insurancePolicyNumber: validated.insurancePolicyNumber || null,
      allergies: validated.allergies || null,
      createdAt: now,
      updatedAt: now
    };
    store.patients.push(newPatientProfile);

    // Initial General Care consent
    store.consents.push({
      id: uuidv4(),
      patientId: patientProfileId,
      consentType: ConsentType.GENERAL_CARE,
      granted: true,
      grantedToRole: null,
      grantedToUserId: null,
      grantedAt: now,
      revokedAt: null,
      revocationReason: null,
      expiresAt: new Date(now.getTime() + 365 * 86400000),
      ipAddress: req.ip || null
    });

    const tokens = generateTokens(newUser);

    recordAuditLog(req, 'PATIENT_REGISTRATION', 'PatientProfile', patientProfileId, { mrn });

    const userSummary: UserSummary = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      patientProfileId,
      doctorProfileId: undefined
    };

    const response: ApiResponse<{ user: UserSummary; tokens: AuthTokens }> = {
      success: true,
      data: {
        user: userSummary,
        tokens
      },
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

export const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'TOKEN_REQUIRED');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = store.users.find(u => u.id === decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or account deactivated', 401, 'UNAUTHORIZED');
    }

    const session = store.refreshTokens.find(s => s.userId === user.id &&
      s.tokenHash === createHash('sha256').update(refreshToken).digest('hex'));
    if (!session || session.revoked || session.expiresAt <= new Date()) {
      // Replay invalidates the token family, including tokens issued after the stolen token.
      for (const s of store.refreshTokens.filter(s => s.userId === user.id)) { s.revoked = true; s.revokedAt = new Date(); }
      recordAuditLog(req, 'REFRESH_REPLAY_DENIED', 'User', user.id);
      throw new AppError('Refresh session revoked or expired', 401, 'INVALID_REFRESH_TOKEN');
    }
    session.revoked = true; session.revokedAt = new Date();
    const tokens = generateTokens(user);
    session.replacedByToken = store.refreshTokens[store.refreshTokens.length - 1].id;

    const response: ApiResponse<AuthTokens> = {
      success: true,
      data: tokens,
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

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      const decoded = jwt.decode(req.headers.authorization!.slice(7)) as { jti: string };
      const session = store.refreshTokens.find(s => s.accessTokenId === decoded.jti);
      if (session) { session.revoked = true; session.revokedAt = new Date(); }
      recordAuditLog(req, 'LOGOUT', 'User', req.user.id);
    }
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Successfully logged out and session revoked.' },
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

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthenticated', 401, 'UNAUTHORIZED');
    }

    const patientProfile = store.patients.find(p => p.userId === req.user!.id);
    const doctorProfile = store.doctors.find(d => d.userId === req.user!.id);

    const userSummary: UserSummary = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      patientProfileId: patientProfile?.id,
      doctorProfileId: doctorProfile?.id
    };

    const response: ApiResponse<{ user: UserSummary; patient?: any; doctor?: any }> = {
      success: true,
      data: {
        user: userSummary,
        patient: patientProfile,
        doctor: doctorProfile
      },
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

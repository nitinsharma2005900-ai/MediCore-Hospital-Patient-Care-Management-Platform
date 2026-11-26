import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { store } from '../database/store';
import { AppError } from './error.middleware';
import { UserRole } from '@medicore/shared';

interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication credentials were not provided or invalid', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    const user = store.users.find(u => u.id === decoded.userId);

    if (!user) {
      throw new AppError('User belonging to this token no longer exists', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('User account has been deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('Account is temporarily locked due to multiple failed login attempts', 403, 'ACCOUNT_LOCKED');
    }

    // Attach profile links
    const patientProfile = store.patients.find(p => p.userId === user.id);
    const doctorProfile = store.doctors.find(d => d.userId === user.id);

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      patientProfileId: patientProfile?.id,
      doctorProfileId: doctorProfile?.id
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Authentication token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid authentication token signature', 401, 'INVALID_TOKEN');
  }
};

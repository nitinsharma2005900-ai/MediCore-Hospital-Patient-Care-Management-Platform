import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@medicore/shared';
import { AppError } from './error.middleware';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthenticated request', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Role '${req.user.role}' lacks permission for this clinical endpoint`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

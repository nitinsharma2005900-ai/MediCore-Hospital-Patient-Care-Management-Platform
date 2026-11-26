import { UserRole } from '@medicore/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
        patientProfileId?: string;
        doctorProfileId?: string;
      };
      correlationId: string;
    }
  }
}

export {};

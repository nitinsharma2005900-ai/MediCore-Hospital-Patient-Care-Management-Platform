import { Router } from 'express';
import { listPatients, getPatientById } from '../controllers/patient.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

// List patients: available to staff
router.get(
  '/',
  requireRole([
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.LAB_TECHNICIAN,
    UserRole.BILLING_OFFICER,
    UserRole.ADMIN
  ]),
  listPatients
);

// Get single patient chart: Patient or Staff
router.get('/:id', getPatientById);

export default router;

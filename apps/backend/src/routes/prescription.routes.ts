import { Router } from 'express';
import { 
  listPrescriptions, 
  getPrescriptionById, 
  createPrescription 
} from '../controllers/prescription.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

router.get('/', listPrescriptions);
router.get('/:id', getPrescriptionById);
router.post('/', requireRole([UserRole.DOCTOR, UserRole.ADMIN]), createPrescription);

export default router;

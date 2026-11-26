import { Router } from 'express';
import { 
  startEncounter, 
  getEncounterById, 
  completeEncounter, 
  recordVitals, 
  addDiagnosis 
} from '../controllers/encounter.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

router.post('/', requireRole([UserRole.DOCTOR, UserRole.ADMIN]), startEncounter);
router.get('/:id', getEncounterById);
router.patch('/:id/complete', requireRole([UserRole.DOCTOR, UserRole.ADMIN]), completeEncounter);
router.post('/vitals', requireRole([UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN]), recordVitals);
router.post('/diagnoses', requireRole([UserRole.DOCTOR, UserRole.ADMIN]), addDiagnosis);

export default router;

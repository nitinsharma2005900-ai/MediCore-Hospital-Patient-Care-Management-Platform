import { clinicalScope } from '../middlewares/scope.middleware';
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

router.post('/', clinicalScope, requireRole([UserRole.DOCTOR]), startEncounter);
router.get('/:id', clinicalScope, getEncounterById);
router.patch('/:id/complete', clinicalScope, requireRole([UserRole.DOCTOR]), completeEncounter);
router.post('/vitals', clinicalScope, requireRole([UserRole.NURSE, UserRole.DOCTOR]), recordVitals);
router.post('/diagnoses', clinicalScope, requireRole([UserRole.DOCTOR]), addDiagnosis);

export default router;

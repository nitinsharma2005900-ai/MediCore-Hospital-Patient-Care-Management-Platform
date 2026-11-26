import { Router } from 'express';
import { 
  listLabOrders, 
  getLabOrderById, 
  createLabOrder, 
  enterLabResult, 
  validateLabResult 
} from '../controllers/lab.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

router.get('/orders', listLabOrders);
router.get('/orders/:id', getLabOrderById);
router.post('/orders', requireRole([UserRole.DOCTOR, UserRole.ADMIN]), createLabOrder);
router.post('/results', requireRole([UserRole.LAB_TECHNICIAN, UserRole.ADMIN]), enterLabResult);
router.patch('/results/:id/validate', requireRole([UserRole.DOCTOR, UserRole.ADMIN]), validateLabResult);

export default router;

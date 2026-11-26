import { Router } from 'express';
import { 
  listAppointments, 
  getAppointmentById, 
  bookAppointment, 
  checkInAppointment, 
  rescheduleAppointment, 
  cancelAppointment,
  listWaitingList,
  addToWaitingList
} from '../controllers/appointment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

router.get('/', listAppointments);
router.get('/waiting-list', listWaitingList);
router.post('/waiting-list', addToWaitingList);
router.get('/:id', getAppointmentById);
router.post('/', bookAppointment);
router.patch(
  '/:id/check-in',
  requireRole([UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.ADMIN]),
  checkInAppointment
);
router.patch('/:id/reschedule', rescheduleAppointment);
router.patch('/:id/cancel', cancelAppointment);

export default router;

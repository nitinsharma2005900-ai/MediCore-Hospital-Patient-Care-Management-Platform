import { Router } from 'express';
import { availableSlots, saveAvailability } from '../controllers/provider-workflow.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { listDoctors, getDoctorById, getDoctorAvailableSlots } from '../controllers/doctor.controller';

const router = Router();

router.get('/', listDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/available-slots', availableSlots);
router.put('/:id/availability', authenticate, saveAvailability);

export default router;

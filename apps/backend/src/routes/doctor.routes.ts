import { Router } from 'express';
import { listDoctors, getDoctorById, getDoctorAvailableSlots } from '../controllers/doctor.controller';

const router = Router();

router.get('/', listDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/available-slots', getDoctorAvailableSlots);

export default router;

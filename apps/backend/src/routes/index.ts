import { Router } from 'express';
import authRoutes from './auth.routes';
import departmentRoutes from './department.routes';
import doctorRoutes from './doctor.routes';
import patientRoutes from './patient.routes';
import appointmentRoutes from './appointment.routes';
import encounterRoutes from './encounter.routes';
import prescriptionRoutes from './prescription.routes';
import labRoutes from './lab.routes';
import billingRoutes from './billing.routes';
import consentRoutes from './consent.routes';
import auditRoutes from './audit.routes';
import notificationRoutes from './notification.routes';
import fhirRoutes from './fhir.routes';
import operationsRoutes from './operations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/encounters', encounterRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/lab', labRoutes);
router.use('/billing', billingRoutes);
router.use('/consent', consentRoutes);
router.use('/audit', auditRoutes);
router.use('/notifications', notificationRoutes);
router.use('/fhir', fhirRoutes);
router.use('/operations', operationsRoutes);

export default router;

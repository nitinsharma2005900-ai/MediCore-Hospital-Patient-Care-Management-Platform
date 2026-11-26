import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';
import { 
  getFhirPatients, 
  getFhirPatientById, 
  getFhirAppointments, 
  getFhirAppointmentById, 
  getFhirEncounters, 
  getFhirEncounterById, 
  getFhirObservations, 
  getFhirObservationById 
} from '../controllers/fhir.controller';

const router = Router();
router.use(authenticate, requireRole([UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE]));

// FHIR R4 Patient Resources
router.get('/Patient', getFhirPatients);
router.get('/Patient/:id', getFhirPatientById);

// FHIR R4 Appointment Resources
router.get('/Appointment', getFhirAppointments);
router.get('/Appointment/:id', getFhirAppointmentById);

// FHIR R4 Encounter Resources
router.get('/Encounter', getFhirEncounters);
router.get('/Encounter/:id', getFhirEncounterById);

// FHIR R4 Observation Resources (Labs and Vitals)
router.get('/Observation', getFhirObservations);
router.get('/Observation/:id', getFhirObservationById);

export default router;

import { Router } from 'express';
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

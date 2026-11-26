import { Request, Response, NextFunction } from 'express';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  FhirPatient, 
  FhirAppointment, 
  FhirEncounter, 
  FhirObservation 
} from '@medicore/shared';

// Helper: Convert internal patient to FHIR Patient
function toFhirPatient(p: any): FhirPatient {
  const user = store.users.find(u => u.id === p.userId);
  return {
    resourceType: 'Patient',
    id: p.id,
    identifier: [
      { system: 'urn:medicore:mrn', value: p.mrn },
      { system: 'urn:medicore:user', value: p.userId }
    ],
    active: true,
    name: [
      {
        use: 'official',
        family: user?.lastName || 'Unknown',
        given: [user?.firstName || 'Patient']
      }
    ],
    telecom: [
      { system: 'phone', value: user?.phone || p.emergencyContactPhone, use: 'mobile' },
      { system: 'email', value: user?.email || '', use: 'home' }
    ],
    gender: p.gender.toLowerCase() as any,
    birthDate: p.dateOfBirth.toISOString().split('T')[0],
    address: [
      {
        line: [p.address],
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477'
      }
    ]
  };
}

// Helper: Convert internal appointment to FHIR Appointment
function toFhirAppointment(a: any): FhirAppointment {
  const doc = store.doctors.find(d => d.id === a.doctorId);
  const docUser = doc ? store.users.find(u => u.id === doc.userId) : null;
  const patient = store.patients.find(p => p.id === a.patientId);
  const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;

  return {
    resourceType: 'Appointment',
    id: a.id,
    status: a.status === 'CONFIRMED' ? 'booked' : (a.status === 'COMPLETED' ? 'fulfilled' : (a.status === 'CANCELLED' ? 'cancelled' : 'proposed')),
    serviceCategory: [
      { coding: [{ code: 'clinical', display: a.type }] }
    ],
    description: a.reason,
    start: a.scheduledStartTime.toISOString(),
    end: a.scheduledEndTime.toISOString(),
    participant: [
      {
        actor: { reference: `Patient/${a.patientId}`, display: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient' },
        status: 'accepted'
      },
      {
        actor: { reference: `Practitioner/${a.doctorId}`, display: docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : 'Physician' },
        status: 'accepted'
      }
    ]
  };
}

// Helper: Convert internal encounter to FHIR Encounter
function toFhirEncounter(e: any): FhirEncounter {
  const doc = store.doctors.find(d => d.id === e.doctorId);
  const docUser = doc ? store.users.find(u => u.id === doc.userId) : null;
  const patient = store.patients.find(p => p.id === e.patientId);
  const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;

  return {
    resourceType: 'Encounter',
    id: e.id,
    status: e.status === 'COMPLETED' ? 'finished' : (e.status === 'IN_PROGRESS' ? 'in-progress' : 'cancelled'),
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    subject: {
      reference: `Patient/${e.patientId}`,
      display: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient'
    },
    participant: [
      {
        individual: {
          reference: `Practitioner/${e.doctorId}`,
          display: docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : 'Attending Physician'
        }
      }
    ],
    period: {
      start: e.startTime.toISOString(),
      end: e.endTime ? e.endTime.toISOString() : undefined
    },
    reasonCode: [
      {
        coding: [{ display: e.chiefComplaint }]
      }
    ]
  };
}

// 1. FHIR Patients
export const getFhirPatients = (req: Request, res: Response, next: NextFunction) => {
  try {
    const fhirPatients = store.patients.slice(0, 50).map(toFhirPatient);
    recordAuditLog(req, 'FHIR_SEARCH_PATIENT', 'FhirBundle', null, { count: fhirPatients.length });

    res.setHeader('Content-Type', 'application/fhir+json');
    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: store.patients.length,
      entry: fhirPatients.map(resource => ({ resource }))
    });
  } catch (err) {
    next(err);
  }
};

export const getFhirPatientById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const p = store.patients.find(pt => pt.id === id);
    if (!p) {
      throw new AppError('FHIR Patient not found', 404, 'NOT_FOUND');
    }

    recordAuditLog(req, 'FHIR_READ_PATIENT', 'FhirPatient', id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(toFhirPatient(p));
  } catch (err) {
    next(err);
  }
};

// 2. FHIR Appointments
export const getFhirAppointments = (req: Request, res: Response, next: NextFunction) => {
  try {
    const fhirApts = store.appointments.slice(0, 50).map(toFhirAppointment);
    recordAuditLog(req, 'FHIR_SEARCH_APPOINTMENT', 'FhirBundle', null, { count: fhirApts.length });

    res.setHeader('Content-Type', 'application/fhir+json');
    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: store.appointments.length,
      entry: fhirApts.map(resource => ({ resource }))
    });
  } catch (err) {
    next(err);
  }
};

export const getFhirAppointmentById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const a = store.appointments.find(apt => apt.id === id);
    if (!a) {
      throw new AppError('FHIR Appointment not found', 404, 'NOT_FOUND');
    }

    recordAuditLog(req, 'FHIR_READ_APPOINTMENT', 'FhirAppointment', id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(toFhirAppointment(a));
  } catch (err) {
    next(err);
  }
};

// 3. FHIR Encounters
export const getFhirEncounters = (req: Request, res: Response, next: NextFunction) => {
  try {
    const fhirEncounters = store.encounters.slice(0, 50).map(toFhirEncounter);
    recordAuditLog(req, 'FHIR_SEARCH_ENCOUNTER', 'FhirBundle', null, { count: fhirEncounters.length });

    res.setHeader('Content-Type', 'application/fhir+json');
    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: store.encounters.length,
      entry: fhirEncounters.map(resource => ({ resource }))
    });
  } catch (err) {
    next(err);
  }
};

export const getFhirEncounterById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const e = store.encounters.find(enc => enc.id === id);
    if (!e) {
      throw new AppError('FHIR Encounter not found', 404, 'NOT_FOUND');
    }

    recordAuditLog(req, 'FHIR_READ_ENCOUNTER', 'FhirEncounter', id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(toFhirEncounter(e));
  } catch (err) {
    next(err);
  }
};

// 4. FHIR Observations (Lab Results and Vitals)
export const getFhirObservations = (req: Request, res: Response, next: NextFunction) => {
  try {
    const observations: FhirObservation[] = store.labResults.slice(0, 50).map(lr => ({
      resourceType: 'Observation',
      id: lr.id,
      status: lr.status === 'FINAL' ? 'final' : 'preliminary',
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }]
        }
      ],
      code: {
        coding: [{ system: 'http://loinc.org', code: lr.testCode, display: lr.testName }]
      },
      subject: {
        reference: `Patient/${lr.patientId}`
      },
      effectiveDateTime: lr.completedAt.toISOString(),
      valueQuantity: {
        value: parseFloat(lr.measuredValue) || 0,
        unit: lr.unit,
        system: 'http://unitsofmeasure.org'
      },
      interpretation: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: lr.interpretation, display: lr.interpretation }]
        }
      ],
      referenceRange: [
        {
          low: lr.referenceRangeLow ? { value: parseFloat(lr.referenceRangeLow) || 0, unit: lr.unit } : undefined,
          high: lr.referenceRangeHigh ? { value: parseFloat(lr.referenceRangeHigh) || 0, unit: lr.unit } : undefined
        }
      ]
    }));

    recordAuditLog(req, 'FHIR_SEARCH_OBSERVATION', 'FhirBundle', null, { count: observations.length });

    res.setHeader('Content-Type', 'application/fhir+json');
    res.json({
      resourceType: 'Bundle',
      type: 'searchset',
      total: store.labResults.length,
      entry: observations.map(resource => ({ resource }))
    });
  } catch (err) {
    next(err);
  }
};

export const getFhirObservationById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lr = store.labResults.find(r => r.id === id);
    if (!lr) {
      throw new AppError('FHIR Observation not found', 404, 'NOT_FOUND');
    }

    const obs: FhirObservation = {
      resourceType: 'Observation',
      id: lr.id,
      status: lr.status === 'FINAL' ? 'final' : 'preliminary',
      category: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }]
        }
      ],
      code: {
        coding: [{ system: 'http://loinc.org', code: lr.testCode, display: lr.testName }]
      },
      subject: {
        reference: `Patient/${lr.patientId}`
      },
      effectiveDateTime: lr.completedAt.toISOString(),
      valueQuantity: {
        value: parseFloat(lr.measuredValue) || 0,
        unit: lr.unit
      },
      interpretation: [
        {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: lr.interpretation, display: lr.interpretation }]
        }
      ],
      referenceRange: [
        {
          low: lr.referenceRangeLow ? { value: parseFloat(lr.referenceRangeLow) || 0, unit: lr.unit } : undefined,
          high: lr.referenceRangeHigh ? { value: parseFloat(lr.referenceRangeHigh) || 0, unit: lr.unit } : undefined
        }
      ]
    };

    recordAuditLog(req, 'FHIR_READ_OBSERVATION', 'FhirObservation', id);
    res.setHeader('Content-Type', 'application/fhir+json');
    res.json(obs);
  } catch (err) {
    next(err);
  }
};

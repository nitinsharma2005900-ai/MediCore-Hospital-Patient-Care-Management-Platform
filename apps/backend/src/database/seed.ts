import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { 
  UserRole, 
  AppointmentStatus, 
  AppointmentType, 
  EncounterStatus, 
  EncounterType, 
  DiagnosisType, 
  PrescriptionStatus, 
  LabOrderStatus, 
  LabPriority, 
  LabInterpretation, 
  InvoiceStatus, 
  InvoiceCategory, 
  PaymentMethod, 
  ConsentType, 
  NotificationChannel, 
  NotificationStatus 
} from '@medicore/shared';
import { store } from './store';

export async function seedDatabase() {
  store.clearAll();
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const now = new Date();

  // 1. Departments (10 Departments)
  const departmentsData = [
    { code: 'CARD', name: 'Cardiology', description: 'Comprehensive heart and cardiovascular care', building: 'Building A', floor: 2 },
    { code: 'NEUR', name: 'Neurology', description: 'Advanced neurological disorders & stroke care', building: 'Building B', floor: 3 },
    { code: 'PED', name: 'Pediatrics', description: 'Child and adolescent healthcare services', building: 'Building C', floor: 1 },
    { code: 'ORTH', name: 'Orthopedics', description: 'Musculoskeletal care, joint replacement, sports medicine', building: 'Building A', floor: 4 },
    { code: 'ONC', name: 'Oncology', description: 'Comprehensive oncology and cancer management', building: 'Building B', floor: 5 },
    { code: 'DERM', name: 'Dermatology', description: 'Skin, hair, and nail clinical specialties', building: 'Building C', floor: 2 },
    { code: 'SURG', name: 'General Surgery', description: 'Minimally invasive and elective surgeries', building: 'Building A', floor: 3 },
    { code: 'EMERG', name: 'Emergency Medicine', description: '24/7 Level 1 Trauma & Urgent Resuscitation', building: 'Building ER', floor: 1 },
    { code: 'RAD', name: 'Radiology & Imaging', description: 'MRI, CT, Ultrasound, and X-ray diagnostics', building: 'Building A', floor: 1 },
    { code: 'INTM', name: 'Internal Medicine', description: 'Adult primary care and chronic disease management', building: 'Building B', floor: 2 }
  ];

  const createdDepartments = departmentsData.map(d => {
    const dept = {
      id: uuidv4(),
      code: d.code,
      name: d.name,
      description: d.description,
      building: d.building,
      floor: d.floor,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    store.departments.push(dept);
    return dept;
  });

  // 2. Demo Users for all 7 Roles
  const demoUsers = [
    { email: 'admin@medicore.health', role: UserRole.ADMIN, firstName: 'Sarah', lastName: 'Connor', phone: '+1-555-0100' },
    { email: 'doctor@medicore.health', role: UserRole.DOCTOR, firstName: 'Alexander', lastName: 'Fleming', phone: '+1-555-0101' },
    { email: 'patient@medicore.health', role: UserRole.PATIENT, firstName: 'Eleanor', lastName: 'Vance', phone: '+1-555-0102' },
    { email: 'receptionist@medicore.health', role: UserRole.RECEPTIONIST, firstName: 'Clara', lastName: 'Oswald', phone: '+1-555-0103' },
    { email: 'nurse@medicore.health', role: UserRole.NURSE, firstName: 'Florence', lastName: 'Nightingale', phone: '+1-555-0104' },
    { email: 'labtech@medicore.health', role: UserRole.LAB_TECHNICIAN, firstName: 'Rosalind', lastName: 'Franklin', phone: '+1-555-0105' },
    { email: 'billing@medicore.health', role: UserRole.BILLING_OFFICER, firstName: 'Warren', lastName: 'Buffett', phone: '+1-555-0106' }
  ];

  const userMap: Record<string, string> = {};
  for (const u of demoUsers) {
    const id = uuidv4();
    store.users.push({
      id,
      email: u.email,
      passwordHash,
      role: u.role,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now
    });
    userMap[u.role] = id;
  }

  // 3. Doctors (15 Doctors)
  const doctorSpecs = [
    { name: 'Dr. Alexander Fleming', email: 'doctor@medicore.health', spec: 'Cardiology', deptCode: 'CARD', lic: 'MED-10001', fee: 180 },
    { name: 'Dr. Gregory House', email: 'house@medicore.health', spec: 'Internal Medicine', deptCode: 'INTM', lic: 'MED-10002', fee: 250 },
    { name: 'Dr. Meredith Grey', email: 'grey@medicore.health', spec: 'General Surgery', deptCode: 'SURG', lic: 'MED-10003', fee: 200 },
    { name: 'Dr. Shaun Murphy', email: 'murphy@medicore.health', spec: 'Pediatrics', deptCode: 'PED', lic: 'MED-10004', fee: 175 },
    { name: 'Dr. Stephen Strange', email: 'strange@medicore.health', spec: 'Neurology', deptCode: 'NEUR', lic: 'MED-10005', fee: 300 },
    { name: 'Dr. Leonard McCoy', email: 'mccoy@medicore.health', spec: 'Emergency Medicine', deptCode: 'EMERG', lic: 'MED-10006', fee: 220 },
    { name: 'Dr. Allison Cameron', email: 'cameron@medicore.health', spec: 'Cardiology', deptCode: 'CARD', lic: 'MED-10007', fee: 180 },
    { name: 'Dr. Derek Shepherd', email: 'shepherd@medicore.health', spec: 'Neurology', deptCode: 'NEUR', lic: 'MED-10008', fee: 320 },
    { name: 'Dr. Miranda Bailey', email: 'bailey@medicore.health', spec: 'General Surgery', deptCode: 'SURG', lic: 'MED-10009', fee: 210 },
    { name: 'Dr. James Wilson', email: 'wilson@medicore.health', spec: 'Oncology', deptCode: 'ONC', lic: 'MED-10010', fee: 240 },
    { name: 'Dr. Callie Torres', email: 'torres@medicore.health', spec: 'Orthopedics', deptCode: 'ORTH', lic: 'MED-10011', fee: 195 },
    { name: 'Dr. Robert Chase', email: 'chase@medicore.health', spec: 'Internal Medicine', deptCode: 'INTM', lic: 'MED-10012', fee: 170 },
    { name: 'Dr. Lisa Cuddy', email: 'cuddy@medicore.health', spec: 'Internal Medicine', deptCode: 'INTM', lic: 'MED-10013', fee: 190 },
    { name: 'Dr. Mark Sloan', email: 'sloan@medicore.health', spec: 'Dermatology', deptCode: 'DERM', lic: 'MED-10014', fee: 160 },
    { name: 'Dr. Cristina Yang', email: 'yang@medicore.health', spec: 'Cardiology', deptCode: 'CARD', lic: 'MED-10015', fee: 220 }
  ];

  const createdDoctors = [];
  for (let i = 0; i < doctorSpecs.length; i++) {
    const d = doctorSpecs[i];
    let userId: string;
    if (d.email === 'doctor@medicore.health') {
      userId = userMap[UserRole.DOCTOR];
    } else {
      userId = uuidv4();
      const parts = d.name.replace('Dr. ', '').split(' ');
      store.users.push({
        id: userId,
        email: d.email,
        passwordHash,
        role: UserRole.DOCTOR,
        firstName: parts[0],
        lastName: parts[1] || 'MD',
        phone: `+1-555-02${i.toString().padStart(2, '0')}`,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now
      });
    }

    const dept = createdDepartments.find(dp => dp.code === d.deptCode) || createdDepartments[0];
    const docProfile = {
      id: uuidv4(),
      userId,
      departmentId: dept.id,
      licenseNumber: d.lic,
      specialization: d.spec,
      consultationFee: d.fee,
      roomNumber: `Suite ${100 + i}`,
      bio: `Board-certified specialist in ${d.spec} with extensive clinical leadership.`,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    store.doctors.push(docProfile);
    createdDoctors.push(docProfile);

    // Doctor availability (Mon-Fri 09:00-17:00, 30 min slots)
    for (let day = 1; day <= 5; day++) {
      store.availabilities.push({
        id: uuidv4(),
        doctorId: docProfile.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 30,
        timeZone: 'UTC',
        isActive: true
      });
    }
  }

  // 4. Patients (~100 synthetic patients)
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const insurances = ['Aetna Health', 'Blue Cross Blue Shield', 'Cigna Global', 'UnitedHealthcare', 'Kaiser Permanente', 'Medicare Choice'];

  const createdPatients = [];
  // First patient is demo patient
  const demoPatientUser = store.users.find(u => u.id === userMap[UserRole.PATIENT])!;
  const demoPatientProfile = {
    id: uuidv4(),
    userId: demoPatientUser.id,
    mrn: 'MRN-2026-0001',
    dateOfBirth: new Date('1988-06-15'),
    gender: 'FEMALE',
    bloodGroup: 'O+',
    emergencyContactName: 'Arthur Vance',
    emergencyContactPhone: '+1-555-9001',
    address: '742 Evergreen Terrace, Springfield, OR',
    insuranceProvider: 'Blue Cross Blue Shield',
    insurancePolicyNumber: 'BCBS-889921',
    allergies: 'Penicillin, Peanuts',
    createdAt: now,
    updatedAt: now
  };
  store.patients.push(demoPatientProfile);
  createdPatients.push(demoPatientProfile);

  // Generate 99 additional synthetic patients
  for (let i = 2; i <= 100; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const gender = (i % 2 === 0) ? 'FEMALE' : 'MALE';
    const bGroup = bloodGroups[i % bloodGroups.length];
    const ins = insurances[i % insurances.length];

    const pUserId = uuidv4();
    store.users.push({
      id: pUserId,
      email: `patient${i}@synthetic.medicore.health`,
      passwordHash,
      role: UserRole.PATIENT,
      firstName: fn,
      lastName: ln,
      phone: `+1-555-${(1000 + i).toString()}`,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now
    });

    const birthYear = 1950 + (i % 50);
    const birthMonth = (i % 12) + 1;
    const birthDay = (i % 28) + 1;

    const patientProf = {
      id: uuidv4(),
      userId: pUserId,
      mrn: `MRN-2026-${i.toString().padStart(4, '0')}`,
      dateOfBirth: new Date(`${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`),
      gender,
      bloodGroup: bGroup,
      emergencyContactName: `Guardian for ${fn}`,
      emergencyContactPhone: `+1-555-88${i.toString().padStart(2, '0')}`,
      address: `${100 + i} Medical Center Way, Suite ${i}, Metropolis`,
      insuranceProvider: ins,
      insurancePolicyNumber: `POL-${800000 + i}`,
      allergies: i % 4 === 0 ? 'Latex, Sulfa' : (i % 7 === 0 ? 'Aspirin' : 'None reported'),
      createdAt: now,
      updatedAt: now
    };
    store.patients.push(patientProf);
    createdPatients.push(patientProf);
  }

  // 5. Patient Consents
  for (const p of createdPatients) {
    store.consents.push({
      id: uuidv4(),
      patientId: p.id,
      consentType: ConsentType.GENERAL_CARE,
      granted: true,
      grantedToRole: null,
      grantedToUserId: null,
      grantedAt: new Date(Date.now() - 30 * 86400000),
      revokedAt: null,
      revocationReason: null,
      expiresAt: new Date(Date.now() + 365 * 86400000),
      ipAddress: '127.0.0.1'
    });
    store.consents.push({
      id: uuidv4(),
      patientId: p.id,
      consentType: ConsentType.CLINICAL_DATA_SHARING,
      granted: true,
      grantedToRole: null,
      grantedToUserId: null,
      grantedAt: new Date(Date.now() - 30 * 86400000),
      revokedAt: null,
      revocationReason: null,
      expiresAt: new Date(Date.now() + 365 * 86400000),
      ipAddress: '127.0.0.1'
    });
  }

  // 6. Appointments (~150 appointments)
  const appointmentStatuses = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.REQUESTED,
    AppointmentStatus.CANCELLED
  ];

  const chiefComplaints = [
    'Persistent chest discomfort on exertion',
    'Recurring tension headaches and dizziness',
    'Annual wellness examination and biometric screening',
    'Acute lower back spasm following heavy lifting',
    'Follow-up evaluation for Type 2 diabetes management',
    'Severe sore throat with fever and dysphagia',
    'Chronic knee pain with morning joint stiffness',
    'Suspicious expanding cutaneous pigmented lesion',
    'Post-operative wound inspection and suture removal',
    'Shortness of breath and wheezing at night'
  ];

  const createdAppointments = [];
  for (let i = 0; i < 150; i++) {
    const patient = createdPatients[i % createdPatients.length];
    const doctor = createdDoctors[i % createdDoctors.length];
    const status = appointmentStatuses[i % appointmentStatuses.length];
    const complaint = chiefComplaints[i % chiefComplaints.length];

    // Spread across past 14 days and next 7 days
    const dayOffset = (i % 21) - 14; 
    const hour = 9 + (i % 7);
    const minute = (i % 2) * 30;

    const startTime = new Date();
    startTime.setDate(startTime.getDate() + dayOffset);
    startTime.setHours(hour, minute, 0, 0);

    const endTime = new Date(startTime.getTime() + 30 * 60000);

    const apt = {
      id: uuidv4(),
      appointmentNumber: `APT-2026-${(1000 + i).toString()}`,
      patientId: patient.id,
      doctorId: doctor.id,
      departmentId: doctor.departmentId,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      status,
      type: i % 4 === 0 ? AppointmentType.FOLLOW_UP : (i % 9 === 0 ? AppointmentType.EMERGENCY : AppointmentType.ROUTINE),
      reason: complaint,
      notes: `Patient scheduled for standard clinical review in ${doctor.specialization}.`,
      cancellationReason: status === AppointmentStatus.CANCELLED ? 'Patient requested schedule postponement' : null,
      cancelledAt: status === AppointmentStatus.CANCELLED ? new Date(startTime.getTime() - 86400000) : null,
      cancelledBy: status === AppointmentStatus.CANCELLED ? patient.id : null,
      checkedInAt: (status === AppointmentStatus.CHECKED_IN || status === AppointmentStatus.IN_PROGRESS || status === AppointmentStatus.COMPLETED) ? new Date(startTime.getTime() - 10 * 60000) : null,
      priority: i % 5 === 0 ? 'HIGH' : 'NORMAL',
      version: 1,
      createdAt: new Date(startTime.getTime() - 3 * 86400000),
      updatedAt: new Date(startTime.getTime() - 3 * 86400000)
    };

    store.appointments.push(apt);
    createdAppointments.push(apt);
  }

  // 7. Encounters (~40 encounters)
  const completedAppointments = createdAppointments.filter(a => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.IN_PROGRESS).slice(0, 40);
  const createdEncounters = [];

  for (let i = 0; i < completedAppointments.length; i++) {
    const apt = completedAppointments[i];
    const enc = {
      id: uuidv4(),
      encounterNumber: `ENC-2026-${(100 + i).toString()}`,
      appointmentId: apt.id,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      startTime: apt.scheduledStartTime,
      endTime: apt.status === AppointmentStatus.COMPLETED ? new Date(apt.scheduledStartTime.getTime() + 35 * 60000) : null,
      status: apt.status === AppointmentStatus.COMPLETED ? EncounterStatus.COMPLETED : EncounterStatus.IN_PROGRESS,
      type: EncounterType.OUTPATIENT,
      chiefComplaint: apt.reason,
      clinicalNotes: `Comprehensive clinical consultation. Patient alert, oriented x4. Systems reviewed. Objective findings documented and treatment plan formulated.`,
      createdAt: apt.scheduledStartTime,
      updatedAt: apt.scheduledStartTime
    };
    store.encounters.push(enc);
    createdEncounters.push(enc);

    // Vital Signs
    store.vitalSigns.push({
      id: uuidv4(),
      encounterId: enc.id,
      patientId: enc.patientId,
      recordedByUserId: userMap[UserRole.NURSE],
      recordedAt: apt.scheduledStartTime,
      systolicBp: 118 + (i % 25),
      diastolicBp: 76 + (i % 15),
      heartRate: 68 + (i % 22),
      respiratoryRate: 16 + (i % 4),
      temperature: 36.8 + ((i % 5) * 0.2),
      oxygenSaturation: 98 - (i % 3),
      heightCm: 172.5,
      weightKg: 74.0 + (i % 15),
      bmi: 24.8,
      notes: 'Vitals stable. Patient in no acute distress.'
    });

    // Diagnoses (ICD-10)
    const icdCodes = [
      { code: 'I10', desc: 'Essential (primary) hypertension' },
      { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications' },
      { code: 'J06.9', desc: 'Acute upper respiratory infection, unspecified' },
      { code: 'M54.5', desc: 'Low back pain' },
      { code: 'K21.9', desc: 'Gastro-esophageal reflux disease without esophagitis' },
      { code: 'R51.9', desc: 'Headache, unspecified' },
      { code: 'E78.5', desc: 'Hyperlipidemia, unspecified' },
      { code: 'J45.909', desc: 'Unspecified asthma, uncomplicated' }
    ];
    const diag = icdCodes[i % icdCodes.length];

    store.diagnoses.push({
      id: uuidv4(),
      encounterId: enc.id,
      patientId: enc.patientId,
      doctorId: enc.doctorId,
      icdCode: diag.code,
      icdDescription: diag.desc,
      type: DiagnosisType.PRIMARY,
      confidence: 'CONFIRMED',
      notes: 'Clinical impression confirmed via examination and symptom concordance.',
      diagnosedAt: apt.scheduledStartTime
    });
  }

  // 8. Prescriptions (~50 prescriptions)
  const medPresets = [
    { name: 'Lisinopril', dose: '10mg', route: 'Oral', freq: 'Once daily in the morning', dur: 30, qty: 30, prec: 'Monitor serum potassium and renal panel.' },
    { name: 'Metformin HCl', dose: '500mg', route: 'Oral', freq: 'Twice daily with meals', dur: 60, qty: 120, prec: 'Take with food to minimize GI side effects.' },
    { name: 'Amoxicillin', dose: '500mg', route: 'Oral', freq: 'Three times daily', dur: 10, qty: 30, prec: 'Complete full course of antibiotic therapy.' },
    { name: 'Atorvastatin', dose: '20mg', route: 'Oral', freq: 'Once daily at bedtime', dur: 30, qty: 30, prec: 'Report unexplained muscle pain or weakness.' },
    { name: 'Omeprazole', dose: '20mg', route: 'Oral', freq: 'Once daily 30m before breakfast', dur: 14, qty: 14, prec: 'Do not crush or chew capsule.' },
    { name: 'Albuterol Inhaler', dose: '90mcg/puff', route: 'Inhalation', freq: '1-2 puffs every 4-6 hours PRN', dur: 30, qty: 1, prec: 'Rinse mouth with water after use.' }
  ];

  for (let i = 0; i < 50; i++) {
    const enc = createdEncounters[i % createdEncounters.length];
    const med = medPresets[i % medPresets.length];

    const rx = {
      id: uuidv4(),
      prescriptionNumber: `RX-2026-${(5000 + i).toString()}`,
      encounterId: enc.id,
      patientId: enc.patientId,
      doctorId: enc.doctorId,
      status: PrescriptionStatus.ACTIVE,
      instructions: `Dispense as written. Patient educated on medication regimen and indications.`,
      startDate: enc.startTime,
      endDate: new Date(enc.startTime.getTime() + med.dur * 86400000),
      createdAt: enc.startTime,
      updatedAt: enc.startTime
    };
    store.prescriptions.push(rx);

    store.prescriptionItems.push({
      id: uuidv4(),
      prescriptionId: rx.id,
      medicationName: med.name,
      dosage: med.dose,
      route: med.route,
      frequency: med.freq,
      durationDays: med.dur,
      quantity: med.qty,
      refillsAllowed: 2,
      precautions: med.prec
    });
  }

  // 9. Lab Orders & Results (~60 lab orders)
  const labPanels = [
    { panel: 'Comprehensive Metabolic Panel (CMP)', code: '24323-8', tests: [
      { name: 'Glucose Fasting', code: '1558-6', val: '94', unit: 'mg/dL', low: '70', high: '99', interp: LabInterpretation.NORMAL },
      { name: 'Creatinine Serum', code: '2160-0', val: '0.92', unit: 'mg/dL', low: '0.60', high: '1.20', interp: LabInterpretation.NORMAL },
      { name: 'Potassium Serum', code: '2823-3', val: '4.4', unit: 'mmol/L', low: '3.5', high: '5.1', interp: LabInterpretation.NORMAL },
      { name: 'Sodium Serum', code: '2951-2', val: '139', unit: 'mmol/L', low: '135', high: '145', interp: LabInterpretation.NORMAL }
    ]},
    { panel: 'Complete Blood Count (CBC)', code: '58410-2', tests: [
      { name: 'White Blood Cell Count', code: '6690-2', val: '6.8', unit: '10*3/uL', low: '4.5', high: '11.0', interp: LabInterpretation.NORMAL },
      { name: 'Hemoglobin', code: '718-7', val: '14.8', unit: 'g/dL', low: '13.5', high: '17.5', interp: LabInterpretation.NORMAL },
      { name: 'Platelet Count', code: '777-3', val: '245', unit: '10*3/uL', low: '150', high: '450', interp: LabInterpretation.NORMAL }
    ]},
    { panel: 'Lipid Profile', code: '5736-2', tests: [
      { name: 'Total Cholesterol', code: '2093-3', val: '185', unit: 'mg/dL', low: '<', high: '200', interp: LabInterpretation.NORMAL },
      { name: 'HDL Cholesterol', code: '2085-9', val: '54', unit: 'mg/dL', low: '40', high: '>', interp: LabInterpretation.NORMAL },
      { name: 'LDL Cholesterol', code: '13457-7', val: '112', unit: 'mg/dL', low: '<', high: '100', interp: LabInterpretation.HIGH },
      { name: 'Triglycerides', code: '2571-8', val: '135', unit: 'mg/dL', low: '<', high: '150', interp: LabInterpretation.NORMAL }
    ]},
    { panel: 'Hemoglobin A1c', code: '4548-4', tests: [
      { name: 'HbA1c Glycated', code: '4548-4', val: '5.6', unit: '%', low: '4.0', high: '5.6', interp: LabInterpretation.NORMAL }
    ]}
  ];

  for (let i = 0; i < 60; i++) {
    const enc = createdEncounters[i % createdEncounters.length];
    const panel = labPanels[i % labPanels.length];
    const isCompleted = i % 5 !== 0;

    const order = {
      id: uuidv4(),
      orderNumber: `LAB-2026-${(3000 + i).toString()}`,
      encounterId: enc.id,
      patientId: enc.patientId,
      orderingDoctorId: enc.doctorId,
      status: isCompleted ? LabOrderStatus.COMPLETED : LabOrderStatus.IN_ANALYSIS,
      priority: i % 8 === 0 ? LabPriority.STAT : (i % 4 === 0 ? LabPriority.URGENT : LabPriority.ROUTINE),
      orderDate: enc.startTime,
      testPanelName: panel.panel,
      clinicalIndication: `Assessment for baseline clinical profiling in ${panel.panel}.`,
      createdAt: enc.startTime,
      updatedAt: enc.startTime
    };
    store.labOrders.push(order);

    if (isCompleted) {
      for (const t of panel.tests) {
        store.labResults.push({
          id: uuidv4(),
          labOrderId: order.id,
          patientId: order.patientId,
          technicianUserId: userMap[UserRole.LAB_TECHNICIAN],
          validatedByUserId: userMap[UserRole.DOCTOR],
          testName: t.name,
          testCode: t.code,
          measuredValue: t.val,
          unit: t.unit,
          referenceRangeLow: t.low,
          referenceRangeHigh: t.high,
          interpretation: t.interp,
          status: 'FINAL',
          specimenType: 'Blood - Serum',
          remarks: 'Specimen processed on automated clinical analyzer. All calibrators in range.',
          completedAt: new Date(enc.startTime.getTime() + 90 * 60000),
          validatedAt: new Date(enc.startTime.getTime() + 120 * 60000)
        });
      }
    }
  }

  // 10. Invoices & Payments (~50 invoices)
  for (let i = 0; i < 50; i++) {
    const enc = createdEncounters[i % createdEncounters.length];
    const doctor = createdDoctors.find(d => d.id === enc.doctorId)!;
    const isPaid = i % 3 !== 0;

    const consultationFee = doctor.consultationFee;
    const labFee = i % 2 === 0 ? 85.00 : 0.00;
    const medFee = 25.00;
    const total = consultationFee + labFee + medFee;
    const paid = isPaid ? total : (i % 2 === 0 ? 50.00 : 0.00);
    const balance = total - paid;
    const status = paid >= total ? InvoiceStatus.PAID : (paid > 0 ? InvoiceStatus.PARTIALLY_PAID : InvoiceStatus.ISSUED);

    const invoice = {
      id: uuidv4(),
      invoiceNumber: `INV-2026-${(7000 + i).toString()}`,
      patientId: enc.patientId,
      encounterId: enc.id,
      status,
      totalAmount: total,
      paidAmount: paid,
      balanceAmount: balance,
      currency: 'USD',
      issuedAt: enc.startTime,
      dueDate: new Date(enc.startTime.getTime() + 30 * 86400000),
      paidAt: isPaid ? new Date(enc.startTime.getTime() + 2 * 3600000) : null,
      createdAt: enc.startTime,
      updatedAt: enc.startTime
    };
    store.invoices.push(invoice);

    store.invoiceItems.push({
      id: uuidv4(),
      invoiceId: invoice.id,
      description: `Specialist Consultation - ${doctor.specialization}`,
      category: InvoiceCategory.CONSULTATION,
      quantity: 1,
      unitPrice: consultationFee,
      totalPrice: consultationFee
    });

    if (labFee > 0) {
      store.invoiceItems.push({
        id: uuidv4(),
        invoiceId: invoice.id,
        description: `Automated Clinical Laboratory Profile`,
        category: InvoiceCategory.LAB_TEST,
        quantity: 1,
        unitPrice: labFee,
        totalPrice: labFee
      });
    }

    store.invoiceItems.push({
      id: uuidv4(),
      invoiceId: invoice.id,
      description: `Pharmacy Medication Dispensation`,
      category: InvoiceCategory.MEDICATION,
      quantity: 1,
      unitPrice: medFee,
      totalPrice: medFee
    });

    if (paid > 0) {
      store.payments.push({
        id: uuidv4(),
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        paymentMethod: PaymentMethod.SIMULATED,
        amount: paid,
        transactionReference: `SIM-TXN-${uuidv4().substring(0, 8).toUpperCase()}`,
        status: 'SUCCESS',
        paymentDate: isPaid ? new Date(enc.startTime.getTime() + 2 * 3600000) : new Date()
      });
    }
  }

  // 11. Initial Audit Logs
  store.auditLogs.push({
    id: uuidv4(),
    action: 'SYSTEM_BOOTSTRAP',
    entityName: 'System',
    entityId: 'SYSTEM',
    performedByUserId: userMap[UserRole.ADMIN],
    userRole: UserRole.ADMIN,
    ipAddress: '127.0.0.1',
    userAgent: 'MediCore-Init/1.0',
    details: JSON.stringify({ message: 'Synthetic hospital database successfully seeded with 100 patients, 15 doctors, 150 appointments.' }),
    timestamp: now,
    requestCorrelationId: 'init-req-001'
  });

  // 12. Notifications for Demo Users
  store.notifications.push({
    id: uuidv4(),
    userId: demoPatientUser.id,
    title: 'Upcoming Specialist Consultation',
    message: 'Your appointment with Dr. Alexander Fleming is scheduled. Please arrive 10 minutes prior.',
    channel: NotificationChannel.IN_APP,
    status: NotificationStatus.SENT,
    sentAt: now,
    readAt: null,
    metadata: JSON.stringify({ type: 'appointment_reminder' }),
    createdAt: now
  });

  store.notifications.push({
    id: uuidv4(),
    userId: userMap[UserRole.DOCTOR],
    title: 'New Clinical Lab Results Released',
    message: 'Comprehensive Metabolic Panel results ready for review.',
    channel: NotificationChannel.IN_APP,
    status: NotificationStatus.SENT,
    sentAt: now,
    readAt: null,
    metadata: JSON.stringify({ type: 'lab_result_ready' }),
    createdAt: now
  });

  console.log(`[MediCore Database Seed] Complete:`);
  console.log(`- Users: ${store.users.length}`);
  console.log(`- Departments: ${store.departments.length}`);
  console.log(`- Doctors: ${store.doctors.length}`);
  console.log(`- Patients: ${store.patients.length}`);
  console.log(`- Appointments: ${store.appointments.length}`);
  console.log(`- Encounters: ${store.encounters.length}`);
  console.log(`- Prescriptions: ${store.prescriptions.length}`);
  console.log(`- Lab Orders: ${store.labOrders.length}`);
  console.log(`- Invoices: ${store.invoices.length}`);
}

// Auto-run if executed directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Database seed finished successfully.');
    process.exit(0);
  }).catch((err) => {
    console.error('Database seed error:', err);
    process.exit(1);
  });
}

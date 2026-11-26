import { clinicalScope } from '../middlewares/scope.middleware';
import { Router } from 'express';
import { z } from 'zod';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { listPatients, getPatientById } from '../controllers/patient.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

// List patients: available to staff
router.get(
  '/',
  requireRole([
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.LAB_TECHNICIAN,
    UserRole.BILLING_OFFICER,
    UserRole.ADMIN
  ]),
  listPatients
);

// Get single patient chart: Patient or Staff
router.get('/:id', clinicalScope, getPatientById);
router.patch('/:id', (req,res,next)=>{
  try{
    if(req.user?.role!==UserRole.PATIENT||req.user.patientProfileId!==req.params.id)throw new AppError('Only the patient may edit this profile',403,'FORBIDDEN');
    const input=z.object({address:z.string().min(5).max(500),emergencyContactName:z.string().min(2).max(100),emergencyContactPhone:z.string().min(7).max(30)}).strict().parse(req.body);
    const patient=store.patients.find(p=>p.id===req.params.id)!;Object.assign(patient,input,{updatedAt:new Date()});
    recordAuditLog(req,'PROFILE_UPDATED','PatientProfile',patient.id);res.json({success:true,data:patient});
  }catch(error){next(error);}
});

export default router;

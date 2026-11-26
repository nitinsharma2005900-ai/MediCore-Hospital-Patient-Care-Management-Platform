import { clinicalScope } from '../middlewares/scope.middleware';
import { Router } from 'express';
import { z } from 'zod';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { PrescriptionStatus } from '@medicore/shared';
import { 
  listPrescriptions, 
  getPrescriptionById, 
  createPrescription 
} from '../controllers/prescription.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

router.get('/', clinicalScope, listPrescriptions);
router.get('/:id', clinicalScope, getPrescriptionById);
router.post('/', clinicalScope, requireRole([UserRole.DOCTOR]), createPrescription);
router.patch('/:id/status', clinicalScope, requireRole([UserRole.DOCTOR]), (req,res,next)=>{
  try{
    const {status}=z.object({status:z.enum(['FILLED','DISCONTINUED'])}).strict().parse(req.body);
    const rx=store.prescriptions.find(p=>p.id===req.params.id);
    if(!rx)throw new AppError('Prescription not found',404,'NOT_FOUND');
    if(rx.status!==PrescriptionStatus.ACTIVE)throw new AppError('Prescription is no longer active',409,'INVALID_STATUS');
    rx.status=status as PrescriptionStatus;rx.updatedAt=new Date();recordAuditLog(req,'PRESCRIPTION_TRANSITION','Prescription',rx.id,{status});res.json({success:true,data:rx});
  }catch(error){next(error);}
});

export default router;

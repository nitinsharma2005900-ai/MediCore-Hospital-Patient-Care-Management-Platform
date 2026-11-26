import { clinicalScope } from '../middlewares/scope.middleware';
import { Router } from 'express';
import { z } from 'zod';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { LabOrderStatus } from '@medicore/shared';
import { 
  listLabOrders, 
  getLabOrderById, 
  createLabOrder, 
  enterLabResult, 
  validateLabResult 
} from '../controllers/lab.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

router.get('/orders', clinicalScope, listLabOrders);
router.get('/orders/:id', clinicalScope, getLabOrderById);
router.post('/orders', clinicalScope, requireRole([UserRole.DOCTOR]), createLabOrder);
router.post('/results', clinicalScope, requireRole([UserRole.LAB_TECHNICIAN]), enterLabResult);
router.patch('/results/:id/validate', clinicalScope, requireRole([UserRole.DOCTOR]), validateLabResult);
router.patch('/orders/:id/status', clinicalScope, requireRole([UserRole.DOCTOR,UserRole.LAB_TECHNICIAN]), (req,res,next)=>{
  try{
    const {status}=z.object({status:z.enum(['COLLECTED','IN_ANALYSIS','CANCELLED'])}).strict().parse(req.body);
    const order=store.labOrders.find(o=>o.id===req.params.id);
    if(!order)throw new AppError('Lab order not found',404,'NOT_FOUND');
    const transitions:Record<string,string[]>={PENDING:['COLLECTED','CANCELLED'],COLLECTED:['IN_ANALYSIS','CANCELLED'],IN_ANALYSIS:['CANCELLED']};
    if(!transitions[order.status]?.includes(status))throw new AppError('Invalid laboratory transition',409,'INVALID_STATUS');
    order.status=status as LabOrderStatus;order.updatedAt=new Date();recordAuditLog(req,'LAB_ORDER_TRANSITION','LabOrder',order.id,{status});res.json({success:true,data:order});
  }catch(error){next(error);}
});

export default router;

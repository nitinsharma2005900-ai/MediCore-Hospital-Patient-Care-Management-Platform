import { appointmentScope } from '../middlewares/scope.middleware';
import { Router } from 'express';
import { z } from 'zod';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  listAppointments, 
  getAppointmentById, 
  bookAppointment, 
  checkInAppointment, 
  rescheduleAppointment, 
  cancelAppointment,
  listWaitingList,
  addToWaitingList
} from '../controllers/appointment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

router.get('/', appointmentScope, listAppointments);
router.get('/waiting-list', appointmentScope, listWaitingList);
router.post('/waiting-list', appointmentScope, addToWaitingList);
router.patch('/waiting-list/:id', appointmentScope, (req,res,next)=>{
  try{
    const {status}=z.object({status:z.enum(['OFFERED','CONVERTED','CANCELLED'])}).strict().parse(req.body);
    const entry=store.waitingList.find(w=>w.id===req.params.id);
    if(!entry)throw new AppError('Waiting-list entry not found',404,'NOT_FOUND');
    if(req.user?.role===UserRole.PATIENT&&(entry.patientId!==req.user.patientProfileId||status!=='CANCELLED'))throw new AppError('Only your own waiting entry may be cancelled',403,'FORBIDDEN');
    if(![UserRole.RECEPTIONIST,UserRole.ADMIN,UserRole.PATIENT].includes(req.user!.role))throw new AppError('Waiting-list operations require reception permission',403,'FORBIDDEN');
    if(!({PENDING:['OFFERED','CANCELLED'],OFFERED:['CONVERTED','CANCELLED']} as Record<string,string[]>)[entry.status]?.includes(status))throw new AppError('Invalid waiting-list transition',409,'INVALID_STATUS');
    if(status==='CONVERTED'&&!store.appointments.some(a=>a.patientId===entry.patientId&&a.departmentId===entry.departmentId&&a.scheduledStartTime>=entry.preferredDate&&!['CANCELLED','NO_SHOW'].includes(a.status)))throw new AppError('Book an appointment before converting the waiting entry',409,'BOOKING_REQUIRED');
    entry.status=status;entry.updatedAt=new Date();recordAuditLog(req,'WAITING_LIST_TRANSITION','WaitingList',entry.id,{status});res.json({success:true,data:entry});
  }catch(error){next(error);}
});
router.get('/:id', appointmentScope, getAppointmentById);
router.post('/', appointmentScope, bookAppointment);
router.patch(
  '/:id/check-in', appointmentScope,
  requireRole([UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.ADMIN]),
  checkInAppointment
);
router.patch('/:id/reschedule', appointmentScope, rescheduleAppointment);
router.patch('/:id/cancel', appointmentScope, cancelAppointment);

export default router;

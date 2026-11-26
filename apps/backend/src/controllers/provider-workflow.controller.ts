import { Request, Response, NextFunction } from 'express';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
export function availableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const date=z.string().date().parse(req.query.date);
    const doctor=store.doctors.find(d=>d.id===req.params.id&&d.isActive);
    if(!doctor)throw new AppError('Provider not found',404,'NOT_FOUND');
    const slots: {startTime:string;endTime:string;label:string;timeZone:string}[]=[];
    for(const a of store.availabilities.filter(a=>a.doctorId===doctor.id&&a.isActive)) {
      const day=DateTime.fromISO(date,{zone:a.timeZone});
      if(day.weekday%7!==a.dayOfWeek)continue;
      const [sh,sm]=a.startTime.split(':').map(Number); const [eh,em]=a.endTime.split(':').map(Number);
      const end=day.set({hour:eh,minute:em});
      for(let start=day.set({hour:sh,minute:sm});start.plus({minutes:a.slotDurationMinutes})<=end;start=start.plus({minutes:a.slotDurationMinutes})) {
        const finish=start.plus({minutes:a.slotDurationMinutes});
        if(start.toMillis()<=Date.now())continue;
        if(store.appointments.some(b=>b.doctorId===doctor.id&&!['CANCELLED','NO_SHOW','RESCHEDULED'].includes(b.status)&&start.toMillis()<b.scheduledEndTime.getTime()&&finish.toMillis()>b.scheduledStartTime.getTime()))continue;
        slots.push({startTime:start.toUTC().toISO()!,endTime:finish.toUTC().toISO()!,label:`${start.toFormat('HH:mm')} – ${finish.toFormat('HH:mm')} (${a.timeZone})`,timeZone:a.timeZone});
      }
    }
    res.json({success:true,data:slots});
  }catch(error){next(error);}
}
export function saveAvailability(req:Request,res:Response,next:NextFunction){
  try{
    if(req.user?.doctorProfileId!==req.params.id)throw new AppError('Only the provider may change availability',403,'FORBIDDEN');
    const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
    const input=z.object({dayOfWeek:z.number().int().min(0).max(6),startTime:time,endTime:time,slotDurationMinutes:z.number().int().min(10).max(120),timeZone:z.string(),isActive:z.boolean().default(true)}).strict().parse(req.body);
    if(input.endTime<=input.startTime||!DateTime.now().setZone(input.timeZone).isValid)throw new AppError('Invalid hours or IANA time zone',400,'INVALID_AVAILABILITY');
    const existing=store.availabilities.find(a=>a.doctorId===req.params.id&&a.dayOfWeek===input.dayOfWeek);
    if(existing)Object.assign(existing,input);else store.availabilities.push({id:randomUUID(),doctorId:req.params.id,...input});
    recordAuditLog(req,'AVAILABILITY_CHANGED','DoctorProfile',req.params.id);res.json({success:true,data:input});
  }catch(error){next(error);}
}

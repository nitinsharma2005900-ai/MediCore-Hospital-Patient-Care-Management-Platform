import { DateTime } from 'luxon';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
export function validateSlot(doctorId: string, start: Date, end: Date, departmentId?: string) {
  const doctor = store.doctors.find(d => d.id === doctorId && d.isActive);
  if (!doctor || (departmentId && doctor.departmentId !== departmentId)) throw new AppError('Doctor/department mismatch', 400, 'INVALID_PROVIDER');
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || start <= new Date()) throw new AppError('Choose a future time range', 400, 'INVALID_TIME_RANGE');
  const available = store.availabilities.some(a => {
    if (a.doctorId !== doctorId || !a.isActive) return false;
    const s = DateTime.fromJSDate(start).setZone(a.timeZone);
    const e = DateTime.fromJSDate(end).setZone(a.timeZone);
    const [sh,sm] = a.startTime.split(':').map(Number);
    const [eh,em] = a.endTime.split(':').map(Number);
    return s.isValid && s.weekday % 7 === a.dayOfWeek && s.toISODate() === e.toISODate() &&
      s.hour * 60 + s.minute >= sh * 60 + sm && e.hour * 60 + e.minute <= eh * 60 + em &&
      end.getTime() - start.getTime() === a.slotDurationMinutes * 60000 &&
      (s.hour * 60 + s.minute - sh * 60 - sm) % a.slotDurationMinutes === 0 && s.second === 0;
  });
  if (!available) throw new AppError('Time is outside provider availability or slot boundaries', 400, 'PROVIDER_UNAVAILABLE');
}

import { Request, Response, NextFunction } from 'express';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { ApiResponse, AppointmentStatus } from '@medicore/shared';

export const listDoctors = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, search } = req.query;

    let doctors = store.doctors.filter(d => d.isActive);

    if (departmentId) {
      doctors = doctors.filter(d => d.departmentId === departmentId);
    }

    let results = doctors.map(doc => {
      const user = store.users.find(u => u.id === doc.userId);
      const department = store.departments.find(dept => dept.id === doc.departmentId);
      return {
        id: doc.id,
        userId: doc.userId,
        name: user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. Specialist',
        email: user?.email,
        phone: user?.phone,
        departmentId: doc.departmentId,
        departmentName: department?.name || 'General Medicine',
        specialization: doc.specialization,
        licenseNumber: doc.licenseNumber,
        consultationFee: doc.consultationFee,
        roomNumber: doc.roomNumber,
        bio: doc.bio
      };
    });

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      results = results.filter(
        d => d.name.toLowerCase().includes(q) || 
             d.specialization.toLowerCase().includes(q) || 
             d.departmentName.toLowerCase().includes(q)
      );
    }

    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
      meta: {
        total: results.length,
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getDoctorById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doc = store.doctors.find(d => d.id === id);
    if (!doc) {
      throw new AppError('Doctor not found', 404, 'NOT_FOUND');
    }

    const user = store.users.find(u => u.id === doc.userId);
    const department = store.departments.find(dept => dept.id === doc.departmentId);
    const availabilities = store.availabilities.filter(a => a.doctorId === id && a.isActive);

    const detailedDoc = {
      ...doc,
      name: user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. Specialist',
      email: user?.email,
      phone: user?.phone,
      departmentName: department?.name,
      availabilities
    };

    const response: ApiResponse<typeof detailedDoc> = {
      success: true,
      data: detailedDoc,
      meta: {
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getDoctorAvailableSlots = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError('Valid query parameter "date" required in YYYY-MM-DD format', 400, 'INVALID_DATE');
    }

    const doc = store.doctors.find(d => d.id === id);
    if (!doc) {
      throw new AppError('Doctor not found', 404, 'NOT_FOUND');
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getUTCDay(); // 0 is Sunday, 1 is Monday...

    const availability = store.availabilities.find(a => a.doctorId === id && a.dayOfWeek === dayOfWeek && a.isActive);
    if (!availability) {
      const response: ApiResponse<{ availableSlots: string[]; reason: string }> = {
        success: true,
        data: {
          availableSlots: [],
          reason: 'Doctor does not have scheduled clinic hours on this day of the week.'
        },
        meta: {
          requestId: req.correlationId,
          timestamp: new Date().toISOString()
        }
      };
      res.json(response);
      return;
    }

    // Generate potential slots (e.g. 09:00, 09:30, 10:00 ...)
    const [startHour, startMin] = availability.startTime.split(':').map(Number);
    const [endHour, endMin] = availability.endTime.split(':').map(Number);
    const slotDuration = availability.slotDurationMinutes || 30;

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    const allSlots: { start: Date; end: Date; label: string }[] = [];
    for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
      const sH = Math.floor(m / 60);
      const sM = m % 60;
      const eH = Math.floor((m + slotDuration) / 60);
      const eM = (m + slotDuration) % 60;

      const slotStart = new Date(`${date}T${sH.toString().padStart(2, '0')}:${sM.toString().padStart(2, '0')}:00.000Z`);
      const slotEnd = new Date(`${date}T${eH.toString().padStart(2, '0')}:${eM.toString().padStart(2, '0')}:00.000Z`);
      const label = `${sH.toString().padStart(2, '0')}:${sM.toString().padStart(2, '0')} - ${eH.toString().padStart(2, '0')}:${eM.toString().padStart(2, '0')}`;

      allSlots.push({ start: slotStart, end: slotEnd, label });
    }

    // Filter out existing booked appointments for doctor on that date
    const existingApts = store.appointments.filter(a => 
      a.doctorId === id && 
      a.status !== AppointmentStatus.CANCELLED &&
      a.status !== AppointmentStatus.NO_SHOW &&
      a.scheduledStartTime.toISOString().startsWith(date)
    );

    const availableSlots = allSlots.filter(slot => {
      const isBooked = existingApts.some(apt => {
        const aptStart = apt.scheduledStartTime.getTime();
        const aptEnd = apt.scheduledEndTime.getTime();
        const sStart = slot.start.getTime();
        const sEnd = slot.end.getTime();
        return (sStart < aptEnd && sEnd > aptStart);
      });
      return !isBooked;
    }).map(s => ({
      startTime: s.start.toISOString(),
      endTime: s.end.toISOString(),
      label: s.label
    }));

    const response: ApiResponse<typeof availableSlots> = {
      success: true,
      data: availableSlots,
      meta: {
        total: availableSlots.length,
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

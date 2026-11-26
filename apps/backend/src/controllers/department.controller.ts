import { Request, Response, NextFunction } from 'express';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { ApiResponse } from '@medicore/shared';

export const listDepartments = (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const departments = store.departments.filter(d => activeOnly ? d.isActive : true);

    const response: ApiResponse<typeof departments> = {
      success: true,
      data: departments,
      meta: {
        total: departments.length,
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getDepartmentById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const department = store.departments.find(d => d.id === id);
    if (!department) {
      throw new AppError('Department not found', 404, 'NOT_FOUND');
    }

    const doctors = store.doctors.filter(d => d.departmentId === id).map(doc => {
      const user = store.users.find(u => u.id === doc.userId);
      return {
        ...doc,
        doctorName: user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr. Specialist',
        email: user?.email
      };
    });

    const response: ApiResponse<{ department: typeof department; doctors: typeof doctors }> = {
      success: true,
      data: { department, doctors },
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

import { Request, Response, NextFunction } from 'express';
import { store } from '../database/store';
import { ApiResponse } from '@medicore/shared';

export const listAuditLogs = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, entityName, userId, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let logs = [...store.auditLogs];

    if (action && typeof action === 'string') {
      logs = logs.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
    }

    if (entityName && typeof entityName === 'string') {
      logs = logs.filter(l => l.entityName.toLowerCase() === entityName.toLowerCase());
    }

    if (userId && typeof userId === 'string') {
      logs = logs.filter(l => l.performedByUserId === userId);
    }

    // Sort descending by timestamp
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const total = logs.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = logs.slice(startIndex, startIndex + limitNum).map(log => {
      const user = store.users.find(u => u.id === log.performedByUserId);
      return {
        ...log,
        performedByUserName: user ? `${user.firstName} ${user.lastName}` : (log.performedByUserId === 'ANONYMOUS' ? 'Public / Anonymous' : 'System Staff'),
        performedByUserEmail: user?.email
      };
    });

    const response: ApiResponse<typeof paginated> = {
      success: true,
      data: paginated,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

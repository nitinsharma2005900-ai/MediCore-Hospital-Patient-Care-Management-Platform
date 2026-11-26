import { Request, Response, NextFunction } from 'express';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { ApiResponse, NotificationStatus } from '@medicore/shared';

export const listNotifications = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthenticated', 401, 'UNAUTHORIZED');
    }

    const notifications = store.notifications
      .filter(n => n.userId === req.user!.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const unreadCount = notifications.filter(n => n.status !== NotificationStatus.READ).length;

    const response: ApiResponse<{ notifications: typeof notifications; unreadCount: number }> = {
      success: true,
      data: { notifications, unreadCount },
      meta: {
        total: notifications.length,
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notif = store.notifications.find(n => n.id === id);
    if (!notif) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    if (notif.userId !== req.user?.id) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    notif.status = NotificationStatus.READ;
    notif.readAt = new Date();

    const response: ApiResponse<typeof notif> = {
      success: true,
      data: notif,
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

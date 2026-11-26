import { Router } from 'express';
import { listNotifications, markAsRead } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.patch('/:id/read', markAsRead);

export default router;

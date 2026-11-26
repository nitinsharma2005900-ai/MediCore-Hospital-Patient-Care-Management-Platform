import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

// Audit logs are restricted to Hospital Administrators
router.get('/', requireRole([UserRole.ADMIN]), listAuditLogs);

export default router;

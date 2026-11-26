import { Router } from 'express';
import { 
  listInvoices, 
  getInvoiceById, 
  createInvoice, 
  recordPayment, 
  getBillingAnalytics 
} from '../controllers/billing.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { UserRole } from '@medicore/shared';

const router = Router();

router.use(authenticate);

router.get('/invoices', listInvoices);
router.get('/invoices/:id', getInvoiceById);
router.get('/analytics', requireRole([UserRole.BILLING_OFFICER, UserRole.ADMIN]), getBillingAnalytics);
router.post('/invoices', requireRole([UserRole.BILLING_OFFICER, UserRole.ADMIN]), createInvoice);
router.post('/payments', recordPayment);

export default router;

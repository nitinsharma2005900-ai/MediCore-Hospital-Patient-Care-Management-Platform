import { billingScope } from '../middlewares/scope.middleware';
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

router.get('/invoices', billingScope, listInvoices);
router.get('/invoices/:id', billingScope, getInvoiceById);
router.get('/analytics', billingScope, requireRole([UserRole.BILLING_OFFICER, UserRole.ADMIN]), getBillingAnalytics);
router.post('/invoices', billingScope, requireRole([UserRole.BILLING_OFFICER, UserRole.ADMIN]), createInvoice);
router.post('/payments', billingScope, recordPayment);

export default router;

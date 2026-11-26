import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../database/store';
import { AppError } from '../middlewares/error.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { 
  CreateInvoiceSchema, 
  RecordPaymentSchema, 
  InvoiceStatus, 
  UserRole, 
  ApiResponse 
} from '@medicore/shared';

export const listInvoices = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, patientId } = req.query;

    let invoices = [...store.invoices];

    if (req.user?.role === UserRole.PATIENT) {
      invoices = invoices.filter(inv => inv.patientId === req.user!.patientProfileId);
    } else if (patientId && typeof patientId === 'string') {
      invoices = invoices.filter(inv => inv.patientId === patientId);
    }

    if (status && typeof status === 'string') {
      invoices = invoices.filter(inv => inv.status === status);
    }

    // Sort by issuedAt descending
    invoices.sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());

    const results = invoices.map(inv => {
      const patient = store.patients.find(p => p.id === inv.patientId);
      const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
      const items = store.invoiceItems.filter(item => item.invoiceId === inv.id);
      const payments = store.payments.filter(p => p.invoiceId === inv.id);

      return {
        ...inv,
        patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient',
        patientMrn: patient?.mrn,
        itemsCount: items.length,
        items,
        payments
      };
    });

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

export const getInvoiceById = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const inv = store.invoices.find(i => i.id === id);
    if (!inv) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    if (req.user?.role === UserRole.PATIENT && req.user.patientProfileId !== inv.patientId) {
      throw new AppError('Access denied: Unauthorized invoice access', 403, 'FORBIDDEN');
    }

    const patient = store.patients.find(p => p.id === inv.patientId);
    const patientUser = patient ? store.users.find(u => u.id === patient.userId) : null;
    const items = store.invoiceItems.filter(item => item.invoiceId === id);
    const payments = store.payments.filter(p => p.invoiceId === id);

    const fullInvoice = {
      ...inv,
      patientName: patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Patient',
      patientMrn: patient?.mrn,
      patientEmail: patientUser?.email,
      patientPhone: patientUser?.phone,
      patientAddress: patient?.address,
      insuranceProvider: patient?.insuranceProvider,
      insurancePolicyNumber: patient?.insurancePolicyNumber,
      items,
      payments
    };

    recordAuditLog(req, 'VIEW_INVOICE', 'Invoice', id);

    const response: ApiResponse<typeof fullInvoice> = {
      success: true,
      data: fullInvoice,
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

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CreateInvoiceSchema.parse(req.body);

    const patient = store.patients.find(p => p.id === validated.patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404, 'PATIENT_NOT_FOUND');
    }
    if (validated.encounterId && !store.encounters.some(e=>e.id===validated.encounterId&&e.patientId===validated.patientId)) throw new AppError('Encounter and patient must match',400,'PATIENT_MISMATCH');

    const now = new Date();
    const invId = uuidv4();
    let totalAmount = 0;

    const lineItems = validated.items.map(item => {
      const lineTotal = Math.round(item.quantity * Math.round(item.unitPrice * 100)) / 100;
      totalAmount = Math.round((totalAmount + lineTotal) * 100) / 100;
      const itemRecord = {
        id: uuidv4(),
        invoiceId: invId,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotal
      };
      store.invoiceItems.push(itemRecord);
      return itemRecord;
    });

    const invoice = {
      id: invId,
      invoiceNumber: `INV-2026-${(store.invoices.length + 7000).toString()}`,
      patientId: validated.patientId,
      encounterId: validated.encounterId || null,
      status: InvoiceStatus.ISSUED,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      currency: 'USD',
      issuedAt: now,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : new Date(now.getTime() + 30 * 86400000),
      paidAt: null,
      createdAt: now,
      updatedAt: now
    };
    store.invoices.push(invoice);

    recordAuditLog(req, 'CREATE_INVOICE', 'Invoice', invId, {
      invoiceNumber: invoice.invoiceNumber,
      totalAmount
    });

    const response: ApiResponse<{ invoice: typeof invoice; items: typeof lineItems }> = {
      success: true,
      data: { invoice, items: lineItems },
      meta: {
        requestId: req.correlationId,
        timestamp: now.toISOString()
      }
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

export const recordPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RecordPaymentSchema.parse(req.body);

    const invoice = store.invoices.find(inv => inv.id === validated.invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new AppError('Invoice is already settled in full', 400, 'ALREADY_PAID');
    }

    if (validated.paymentMethod !== 'SIMULATED') throw new AppError('Only simulated payments are supported', 400, 'SIMULATION_ONLY');
    if (validated.amount > invoice.balanceAmount) throw new AppError('Amount exceeds outstanding balance', 400, 'OVERPAYMENT');
    const duplicate = validated.transactionReference && store.payments.find(p => p.transactionReference === validated.transactionReference);
    if (duplicate) throw new AppError('Payment reference already processed', 409, 'DUPLICATE_PAYMENT');
    const paymentAmount = Math.round(validated.amount * 100) / 100;
    const newPaid = Math.round((invoice.paidAmount + paymentAmount) * 100) / 100;
    const newBalance = Math.max(0, Math.round((invoice.totalAmount - newPaid) * 100) / 100);

    const now = new Date();
    const paymentRecord = {
      id: uuidv4(),
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      paymentMethod: validated.paymentMethod,
      amount: paymentAmount,
      transactionReference: validated.transactionReference || `SIM-PAY-${uuidv4().substring(0, 8).toUpperCase()}`,
      status: 'SUCCESS',
      paymentDate: now
    };
    store.payments.push(paymentRecord);

    invoice.paidAmount = newPaid;
    invoice.balanceAmount = newBalance;
    invoice.status = newBalance <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
    if (newBalance <= 0) {
      invoice.paidAt = now;
    }
    invoice.updatedAt = now;

    recordAuditLog(req, 'RECORD_PAYMENT', 'Payment', paymentRecord.id, {
      invoiceNumber: invoice.invoiceNumber,
      amount: paymentAmount,
      remainingBalance: newBalance
    });

    const response: ApiResponse<{ payment: typeof paymentRecord; invoice: typeof invoice }> = {
      success: true,
      data: { payment: paymentRecord, invoice },
      meta: {
        requestId: req.correlationId,
        timestamp: now.toISOString()
      }
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getBillingAnalytics = (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalBilled = store.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalCollected = store.invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const outstandingBalance = store.invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);

    const paidInvoices = store.invoices.filter(i => i.status === InvoiceStatus.PAID).length;
    const partialInvoices = store.invoices.filter(i => i.status === InvoiceStatus.PARTIALLY_PAID).length;
    const issuedInvoices = store.invoices.filter(i => i.status === InvoiceStatus.ISSUED).length;

    const summary = {
      totalBilled: parseFloat(totalBilled.toFixed(2)),
      totalCollected: parseFloat(totalCollected.toFixed(2)),
      outstandingBalance: parseFloat(outstandingBalance.toFixed(2)),
      collectionRate: totalBilled > 0 ? parseFloat(((totalCollected / totalBilled) * 100).toFixed(1)) : 100,
      counts: {
        total: store.invoices.length,
        paid: paidInvoices,
        partial: partialInvoices,
        unpaid: issuedInvoices
      }
    };

    const response: ApiResponse<typeof summary> = {
      success: true,
      data: summary,
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

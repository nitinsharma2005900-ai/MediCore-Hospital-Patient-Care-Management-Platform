import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@medicore/shared';
import { store } from '../database/store';

export function recordAuditLog(
  req: Request,
  action: string,
  entityName: string,
  entityId?: string | null,
  details?: Record<string, any>
) {
  try {
    const performedByUserId = req.user?.id || 'ANONYMOUS';
    const userRole = req.user?.role || (UserRole.PATIENT as any);
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const correlationId = req.correlationId || uuidv4();

    store.auditLogs.unshift({
      id: uuidv4(),
      action,
      entityName,
      entityId: entityId || null,
      performedByUserId,
      userRole,
      ipAddress,
      userAgent,
      details: details ? JSON.stringify(details) : null,
      timestamp: new Date(),
      requestCorrelationId: correlationId
    });
  } catch (err) {
    console.error('[Audit Log Failure]', err);
  }
}

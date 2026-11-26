import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@medicore/shared';
import { store } from '../database/store';
import { AppError } from './error.middleware';
import { recordAuditLog } from './audit.middleware';

export function activeConsent(req: Request, patientId: string, consentType = 'CLINICAL_DATA_SHARING') {
  return store.consents.some(c => c.patientId === patientId && c.consentType === consentType && c.granted &&
    !c.revokedAt && (!c.expiresAt || c.expiresAt > new Date()) &&
    (!c.grantedToRole || c.grantedToRole === req.user?.role) &&
    (!c.grantedToUserId || c.grantedToUserId === req.user?.id));
}
export function canAccessClinical(req: Request, patientId: string) {
  const user = req.user;
  if (!user) return false;
  if (user.role === UserRole.PATIENT) return user.patientProfileId === patientId;
  const related = user.role === UserRole.DOCTOR
    ? store.appointments.some(a => a.patientId === patientId && a.doctorId === user.doctorProfileId && !['CANCELLED','NO_SHOW'].includes(a.status))
    : user.role === UserRole.NURSE && store.careAssignments.some(a => a.patientId === patientId && a.nurseUserId === user.id && a.active);
  return Boolean(related && activeConsent(req, patientId));
}
function deny(req: Request, message = 'Access denied by record relationship or patient consent'): never {
  recordAuditLog(req, 'ACCESS_DENIED', 'Authorization', undefined, { resource: req.baseUrl, method: req.method });
  throw new AppError(message, 403, 'FORBIDDEN');
}
export function clinicalScope(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const user = req.user;
    const area = req.baseUrl.split('/').pop();
    let patientId = req.body?.patientId as string | undefined;
    let doctorId: string | undefined;
    if (area === 'patients') {
      patientId = req.params.id;
      if (!patientId) return next(); // Collection controller returns only the permitted projection.
    }
    const resource = area === 'encounters' ? store.encounters.find(e => e.id === (req.params.id || req.body?.encounterId))
      : area === 'prescriptions' ? store.prescriptions.find(e => e.id === req.params.id)
      : area === 'lab' ? (req.path.includes('/results')
        ? store.labOrders.find(o => o.id === (req.body?.labOrderId || store.labResults.find(r => r.id === req.params.id)?.labOrderId))
        : store.labOrders.find(o => o.id === req.params.id)) : undefined;
    const enc = req.body?.encounterId ? store.encounters.find(e => e.id === req.body.encounterId) : undefined;
    const apt = req.body?.appointmentId ? store.appointments.find(a => a.id === req.body.appointmentId) : undefined;
    const linked = resource || enc || apt;
    if (linked) {
      if (patientId && linked.patientId !== patientId) throw new AppError('Patient does not match the parent record', 400, 'PATIENT_MISMATCH');
      patientId = linked.patientId;
      doctorId = 'doctorId' in linked ? linked.doctorId : linked.orderingDoctorId;
    }
    if (area === 'lab' && user.role === UserRole.LAB_TECHNICIAN) {
      if (resource && 'assignedTechnicianUserId' in resource && resource.assignedTechnicianUserId !== user.id) deny(req);
      if (patientId && !activeConsent(req, patientId)) deny(req);
      if (patientId && req.method !== 'GET' && !activeConsent(req, patientId, 'GENERAL_CARE')) deny(req);
      return next();
    }
    if (![UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE].includes(user.role)) deny(req);
    if (patientId && !canAccessClinical(req, patientId)) deny(req);
    if (user.role === UserRole.DOCTOR && doctorId && doctorId !== user.doctorProfileId) deny(req);
    if (req.method !== 'GET' && patientId && !activeConsent(req, patientId, 'GENERAL_CARE')) deny(req);
    const clinicalParent=enc || apt || (area==='encounters'?resource:undefined);
    if (req.method !== 'GET' && clinicalParent && 'status' in clinicalParent &&
        !['IN_PROGRESS', 'CHECKED_IN'].includes(clinicalParent.status)) throw new AppError('Parent workflow is not active', 409, 'INVALID_STATUS');
    if (req.method === 'GET') recordAuditLog(req,'CLINICAL_RECORD_READ',area || 'ClinicalAccess',patientId || null);
    next();
  } catch (error) { next(error); }
}
export function appointmentScope(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    if (![UserRole.PATIENT,UserRole.RECEPTIONIST,UserRole.DOCTOR,UserRole.NURSE,UserRole.ADMIN].includes(user.role)) deny(req);
    const apt = store.appointments.find(a => a.id === req.params.id);
    if (apt && user.role === UserRole.PATIENT && apt.patientId !== user.patientProfileId) deny(req);
    if (apt && user.role === UserRole.DOCTOR && apt.doctorId !== user.doctorProfileId) deny(req);
    if (user.role === UserRole.PATIENT && req.body?.patientId && req.body.patientId !== user.patientProfileId) deny(req);
    if (user.role === UserRole.NURSE && apt && !store.careAssignments.some(a => a.patientId === apt.patientId && a.nurseUserId === user.id && a.active)) deny(req);
    next();
  } catch (error) { next(error); }
}
export function billingScope(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    if (![UserRole.PATIENT,UserRole.BILLING_OFFICER,UserRole.ADMIN].includes(user.role)) deny(req);
    const invoice = store.invoices.find(i => i.id === (req.params.id || req.body?.invoiceId));
    if (invoice && user.role === UserRole.PATIENT && invoice.patientId !== user.patientProfileId) deny(req);
    next();
  } catch (error) { next(error); }
}

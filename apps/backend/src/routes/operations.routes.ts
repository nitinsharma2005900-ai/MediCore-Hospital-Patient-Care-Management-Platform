import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { UserRole } from '@medicore/shared';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { recordAuditLog } from '../middlewares/audit.middleware';
import { AppError } from '../middlewares/error.middleware';
import { store } from '../database/store';
const router = Router();
router.use(authenticate, requireRole([UserRole.ADMIN]));
router.get('/analytics-source', (req, res) => {
  const data = {
    appointments: store.appointments.map(a => ({ status: a.status, department_name: store.departments.find(d => d.id === a.departmentId)?.name })),
    encounters: store.encounters.map(e => ({ startTime: e.startTime, checkedInAt: store.appointments.find(a => a.id === e.appointmentId)?.checkedInAt })),
    labOrders: store.labOrders.map(o => ({ status: o.status, priority: o.priority, orderDate: o.orderDate, updatedAt: o.updatedAt })),
    patients: store.patients.map(p => ({ dateOfBirth: p.dateOfBirth, gender: p.gender, bloodGroup: p.bloodGroup })),
    departments: store.departments.map(d => ({ name: d.name, activeDoctors: store.doctors.filter(p => p.departmentId === d.id && p.isActive).length }))
  };
  recordAuditLog(req, 'READ_OPERATIONAL_ANALYTICS', 'Analytics');
  res.json({ success: true, data });
});
router.get('/staff', (_req, res) => res.json({ success: true, data: store.users.filter(u => u.role !== UserRole.PATIENT)
  .map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, isActive: u.isActive })) }));
router.patch('/staff/:id', (req, res, next) => {
  try {
    const input = z.object({ isActive: z.boolean() }).strict().parse(req.body);
    const user = store.users.find(u => u.id === req.params.id && u.role !== UserRole.PATIENT);
    if (!user) throw new AppError('Staff member not found', 404, 'NOT_FOUND');
    if (user.id === req.user?.id) throw new AppError('Cannot deactivate the current account', 400, 'SELF_DEACTIVATION');
    user.isActive = input.isActive; user.updatedAt = new Date();
    for (const token of store.refreshTokens.filter(t => t.userId === user.id)) token.revoked = true;
    recordAuditLog(req, 'STAFF_STATUS_CHANGED', 'User', user.id);
    res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
  } catch (error) { next(error); }
});
router.post('/staff', async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().min(12), firstName: z.string().min(1), lastName: z.string().min(1),
      role: z.enum(['RECEPTIONIST','DOCTOR','NURSE','LAB_TECHNICIAN','BILLING_OFFICER','ADMIN']), departmentId: z.string().optional(), specialization: z.string().optional(), licenseNumber: z.string().optional() }).strict().parse(req.body);
    if (store.users.some(u => u.email.toLowerCase() === input.email.toLowerCase())) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    if (input.role === 'DOCTOR' && (!input.licenseNumber || !input.specialization || !store.departments.some(d => d.id === input.departmentId))) throw new AppError('Doctor requires a valid department, license, and specialization', 400, 'DOCTOR_PROFILE_REQUIRED');
    const now = new Date(); const id = randomUUID();
    store.users.push({ id, email: input.email.toLowerCase(), passwordHash: await bcrypt.hash(input.password, 12), firstName: input.firstName, lastName: input.lastName,
      role: input.role as UserRole, isActive: true, failedLoginAttempts: 0, createdAt: now, updatedAt: now });
    if (input.role === 'DOCTOR') store.doctors.push({ id: randomUUID(), userId: id, departmentId: input.departmentId!, licenseNumber: input.licenseNumber!, specialization: input.specialization!, consultationFee: 150, isActive: true, createdAt: now, updatedAt: now });
    recordAuditLog(req, 'STAFF_CREATED', 'User', id);
    res.status(201).json({ success: true, data: { id, email: input.email, role: input.role } });
  } catch (error) { next(error); }
});
router.post('/departments', (req, res, next) => {
  try {
    const input = z.object({ code: z.string().min(2).max(12), name: z.string().min(2).max(100), description: z.string().max(500).optional() }).strict().parse(req.body);
    if (store.departments.some(d => d.code === input.code)) throw new AppError('Department code exists', 409, 'DUPLICATE_RECORD');
    const now = new Date(); const dept = { ...input, id: randomUUID(), isActive: true, createdAt: now, updatedAt: now };
    store.departments.push(dept); recordAuditLog(req, 'DEPARTMENT_CREATED', 'Department', dept.id);
    res.status(201).json({ success: true, data: dept });
  } catch (error) { next(error); }
});
router.post('/care-assignments', (req, res, next) => {
  try {
    const input = z.object({ patientId: z.string().uuid(), nurseUserId: z.string().uuid(), active: z.boolean().default(true) }).strict().parse(req.body);
    if (!store.patients.some(p => p.id === input.patientId) || !store.users.some(u => u.id === input.nurseUserId && u.role === UserRole.NURSE)) throw new AppError('Invalid patient or nurse', 400, 'INVALID_ASSIGNMENT');
    const existing = store.careAssignments.find(a => a.patientId === input.patientId && a.nurseUserId === input.nurseUserId);
    if (existing) existing.active = input.active; else store.careAssignments.push({ id: randomUUID(), ...input });
    recordAuditLog(req, 'CARE_ASSIGNMENT_CHANGED', 'CareAssignment'); res.json({ success: true });
  } catch (error) { next(error); }
});
export default router;

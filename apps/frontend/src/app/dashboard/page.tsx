'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { UserRole } from '@medicore/shared';
import PatientDashboard from './patient/page';
import DoctorDashboard from './doctor/page';
import ReceptionistDashboard from './receptionist/page';
import NurseDashboard from './nurse/page';
import LabDashboard from './lab/page';
import BillingDashboard from './billing/page';
import AdminDashboard from './admin/page';

export default function DashboardRouterPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading MediCore Clinical Workspace...</p>
      </div>
    );
  }

  // Render the exact role-based dashboard based on the logged-in user
  switch (user.role) {
    case UserRole.PATIENT:
      return <PatientDashboard />;
    case UserRole.DOCTOR:
      return <DoctorDashboard />;
    case UserRole.RECEPTIONIST:
      return <ReceptionistDashboard />;
    case UserRole.NURSE:
      return <NurseDashboard />;
    case UserRole.LAB_TECHNICIAN:
      return <LabDashboard />;
    case UserRole.BILLING_OFFICER:
      return <BillingDashboard />;
    case UserRole.ADMIN:
      return <AdminDashboard />;
    default:
      return <PatientDashboard />;
  }
}

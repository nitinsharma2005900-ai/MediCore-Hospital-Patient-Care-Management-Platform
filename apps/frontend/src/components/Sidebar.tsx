'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Calendar, 
  Users, 
  FileText, 
  FlaskConical, 
  CreditCard, 
  ShieldCheck, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Stethoscope,
  HeartPulse,
  ClipboardList,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { UserRole } from '@medicore/shared';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Role Dashboard', href: '/dashboard', icon: Activity },
  { label: 'Book Appointment', href: '/appointments/book', icon: Calendar, roles: [UserRole.PATIENT, UserRole.RECEPTIONIST, UserRole.ADMIN] },
  { label: 'My Care & History', href: '/dashboard/patient', icon: HeartPulse, roles: [UserRole.PATIENT] },
  { label: 'Clinical Encounters', href: '/dashboard/doctor', icon: Stethoscope, roles: [UserRole.DOCTOR, UserRole.ADMIN] },
  { label: 'Patient Check-In', href: '/dashboard/receptionist', icon: ClipboardList, roles: [UserRole.RECEPTIONIST, UserRole.ADMIN] },
  { label: 'Triage & Vitals', href: '/dashboard/nurse', icon: HeartPulse, roles: [UserRole.NURSE, UserRole.ADMIN] },
  { label: 'Lab Workstation', href: '/dashboard/lab', icon: FlaskConical, roles: [UserRole.LAB_TECHNICIAN, UserRole.ADMIN] },
  { label: 'Billing & Invoices', href: '/dashboard/billing', icon: CreditCard, roles: [UserRole.BILLING_OFFICER, UserRole.ADMIN] },
  { label: 'Hospital Analytics', href: '/dashboard/admin', icon: BarChart3, roles: [UserRole.ADMIN] },
  { label: 'API Documentation', href: 'http://localhost:4000/api-docs', icon: BookOpen }
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const userRole = user?.role || UserRole.PATIENT;

  const filteredItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside 
      className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Logo Banner */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F766E] to-[#2563EB] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  Medi<span className="text-[#0F766E]">Core</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Hospital OS</span>
              </div>
            )}
          </Link>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Current Active Role Badge */}
        {!collapsed && user && (
          <div className="mx-4 mt-4 p-3 bg-teal-50/70 border border-teal-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Active Role</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{user.role}</div>
            <div className="text-xs text-slate-500 truncate">{user.firstName} {user.lastName}</div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="mt-4 px-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isExternal = item.href.startsWith('http');

            if (isExternal) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-[#0F766E] transition-all`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-[#0F766E] text-white shadow-sm shadow-teal-900/10' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={logout}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

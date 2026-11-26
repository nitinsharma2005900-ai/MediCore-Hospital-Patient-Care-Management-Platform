'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Activity, 
  ShieldCheck, 
  Calendar, 
  UserCheck, 
  FileText, 
  FlaskConical, 
  CreditCard, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Building2,
  Stethoscope,
  Users,
  Database
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '@/components/AuthContext';
import { UserRole } from '@medicore/shared';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { switchRole, user } = useAuth();
  const router = useRouter();

  const handleDemoLogin = async (role: UserRole) => {
    await switchRole(role);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0F766E] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-teal-900/10">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">Medi<span className="text-[#0F766E]">Core</span></span>
              <span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hospital & Patient Care Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#roles" className="hover:text-[#0F766E] transition-colors">User Roles</a>
            <a href="#workflows" className="hover:text-[#0F766E] transition-colors">Clinical Workflow</a>
            <a href="#architecture" className="hover:text-[#0F766E] transition-colors">Architecture</a>
            <a href="http://localhost:4000/api-docs" target="_blank" rel="noreferrer" className="hover:text-[#0F766E] transition-colors flex items-center gap-1">
              API Docs <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">Swagger</span>
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link 
                href="/dashboard" 
                className="bg-[#0F766E] hover:bg-[#0D655E] text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center space-x-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-slate-700 hover:text-[#0F766E] font-medium text-sm px-4 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-[#0F766E] hover:bg-[#0D655E] text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all"
                >
                  Patient Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              <span>Full-Stack Hospital Operations & Patient Care Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              The Unified Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F766E] to-[#2563EB]">Modern Healthcare</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              MediCore unifies multi-role hospital workflows from patient registration and concurrency-protected appointment scheduling to EHR encounters, diagnostic lab orders, electronic prescriptions, billing, and FHIR interoperability.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a 
                href="#roles" 
                className="bg-[#0F766E] hover:bg-[#0D655E] text-white px-8 py-3.5 rounded-xl text-base font-semibold shadow-lg shadow-teal-900/20 hover:shadow-teal-900/30 transition-all flex items-center space-x-2"
              >
                <span>Launch Role Portals</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link 
                href="/login" 
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-8 py-3.5 rounded-xl text-base font-semibold shadow-sm transition-all"
              >
                Live Demo Accounts
              </Link>
            </div>
          </div>

          {/* Operational Metrics Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="text-3xl font-extrabold text-[#0F766E]">10</div>
              <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Clinical Departments</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="text-3xl font-extrabold text-[#2563EB]">15</div>
              <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Board Specialists</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="text-3xl font-extrabold text-slate-900">100+</div>
              <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Synthetic Patients</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="text-3xl font-extrabold text-[#16A34A]">100%</div>
              <div className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Concurrency Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 User Roles Showcase */}
      <section id="roles" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#0F766E] uppercase tracking-widest">Least-Privilege Security</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Seven Purpose-Built Healthcare Portals
            </p>
            <p className="mt-4 text-slate-600">
              Each healthcare persona enjoys a tailored experience with backend-enforced role permissions and resource-level authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* 1. Patient */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0F766E] flex items-center justify-center mb-4">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Patient Portal</h3>
                <p className="text-xs text-slate-500 mt-1">Self-service registration, appointment scheduling, personal prescriptions, lab results, billing balance, and consent management.</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleDemoLogin(UserRole.PATIENT)}
                  className="w-full bg-white hover:bg-teal-50 border border-slate-300 text-[#0F766E] text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Launch as Patient</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Doctor */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center mb-4">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Doctor Portal</h3>
                <p className="text-xs text-slate-500 mt-1">Daily clinical schedules, active encounters, recording ICD-10 diagnoses, electronic prescriptions, and diagnostic lab requisitions.</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleDemoLogin(UserRole.DOCTOR)}
                  className="w-full bg-white hover:bg-blue-50 border border-slate-300 text-[#2563EB] text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Launch as Doctor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Receptionist */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Receptionist</h3>
                <p className="text-xs text-slate-500 mt-1">Patient check-in desk, appointment booking, rescheduling, cancellations, and waiting list queue coordination.</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleDemoLogin(UserRole.RECEPTIONIST)}
                  className="w-full bg-white hover:bg-indigo-50 border border-slate-300 text-indigo-600 text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Launch as Receptionist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Nurse */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Clinical Nurse</h3>
                <p className="text-xs text-slate-500 mt-1">Assigned patient monitoring, vital signs triage recorder (BP, HR, SpO2, Temperature, BMI), and clinical support.</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleDemoLogin(UserRole.NURSE)}
                  className="w-full bg-white hover:bg-emerald-50 border border-slate-300 text-[#16A34A] text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Launch as Nurse</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 5. Lab Technician */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Lab Technician</h3>
                <p className="text-xs text-slate-500 mt-1">Specimen processing, logging LOINC test readings, reference intervals, interpretation, and preliminary result release.</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleDemoLogin(UserRole.LAB_TECHNICIAN)}
                  className="w-full bg-white hover:bg-purple-50 border border-slate-300 text-purple-600 text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Launch as Lab Tech</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 6. Billing Officer */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Billing Officer</h3>
                <p className="text-xs text-slate-500 mt-1">Generating itemized invoices, fee calculations, simulated payment settlement, and revenue reports without diagnosis leakage.</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleDemoLogin(UserRole.BILLING_OFFICER)}
                  className="w-full bg-white hover:bg-amber-50 border border-slate-300 text-amber-600 text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Launch as Billing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 7. Hospital Administrator */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Hospital Admin</h3>
                <p className="text-xs text-slate-500 mt-1">Clinical departments, staff roster, operational analytics via Python microservice, system health, and audit trail inspection.</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => handleDemoLogin(UserRole.ADMIN)}
                  className="w-full bg-white hover:bg-rose-50 border border-slate-300 text-rose-600 text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Launch as Admin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials */}
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-md">
              <div>
                <span className="text-[10px] font-mono uppercase bg-teal-800 text-teal-200 px-2 py-0.5 rounded">Demo Credentials</span>
                <h3 className="text-lg font-bold mt-2">Shared Password</h3>
                <p className="text-xs text-slate-300 mt-1">All pre-seeded demo accounts share the password:</p>
                <div className="mt-3 bg-black/40 px-3 py-2 rounded-lg font-mono text-sm text-teal-300 border border-teal-500/30">
                  Password123!
                </div>
              </div>
              <Link 
                href="/login" 
                className="mt-4 block text-center bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs py-2.5 rounded-lg transition-colors"
              >
                Go to Login Page
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Clinical Care Workflow */}
      <section id="workflows" className="py-20 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#0F766E] uppercase tracking-widest">End-to-End Orchestration</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Complete Hospital Patient Care Lifecycle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-xs font-mono font-bold text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-md">STEP 01</span>
              <h4 className="text-base font-bold text-slate-900 mt-3">Registration & Booking</h4>
              <p className="text-xs text-slate-500 mt-1.5">Patient signs up, obtains unique MRN, selects specialist, and reserves 30-min slot with concurrency lock.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-md">STEP 02</span>
              <h4 className="text-base font-bold text-slate-900 mt-3">Check-In & Triage</h4>
              <p className="text-xs text-slate-500 mt-1.5">Receptionist checks in patient. Clinical Nurse triages and records vitals (Blood pressure, heart rate, BMI).</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">STEP 03</span>
              <h4 className="text-base font-bold text-slate-900 mt-3">Encounter & Orders</h4>
              <p className="text-xs text-slate-500 mt-1.5">Doctor consults, enters ICD-10 diagnosis, prescribes medications, and requisitions diagnostic lab panels.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-xs font-mono font-bold text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-md">STEP 04</span>
              <h4 className="text-base font-bold text-slate-900 mt-3">Lab, Billing & Audit</h4>
              <p className="text-xs text-slate-500 mt-1.5">Lab technician inputs findings, doctor validates to FINAL, billing officer bills items, and payment settles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-400" />
            <span className="text-base font-bold text-white">MediCore</span>
            <span className="text-slate-500">| Hospital, Appointment & Patient Care Management Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-300">
            <a href="http://localhost:4000/api-docs" target="_blank" rel="noreferrer" className="hover:text-white">API Swagger</a>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-white">Analytics FastAPI Docs</a>
            <a href="http://localhost:4000/health" target="_blank" rel="noreferrer" className="hover:text-white">Backend Health</a>
          </div>

          <p className="text-slate-500 text-center md:text-right">
            Synthetic Educational Assessment Project. Not intended for actual medical treatment or clinical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

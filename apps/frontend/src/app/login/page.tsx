'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '@/components/AuthContext';
import { UserRole } from '@medicore/shared';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('doctor@medicore.health');
  const [password, setPassword] = useState('Password123!');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.DOCTOR);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.pass);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const ok = await login(email, password);
      if (ok) {
        router.push('/dashboard');
      } else {
        setError('Invalid credentials or account is inactive. Please check your email and password.');
      }
    } catch {
      setError('Connection to MediCore API failed. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-teal-50/20 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side: Role Quick Selection */}
        <div className="lg:col-span-5 bg-gradient-to-b from-teal-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-xl font-bold tracking-tight">Medi<span className="text-teal-400">Core</span></span>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-bold">1-Click Demo Profiles</h2>
              <p className="text-xs text-slate-300 mt-1">Select any of the 7 user roles to autofill verified demo credentials:</p>

              <div className="mt-4 space-y-2">
                {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => {
                  const isSelected = selectedRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleSelectRole(r)}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                        isSelected 
                          ? 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-sm' 
                          : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                      }`}
                    >
                      <span>{DEMO_CREDENTIALS[r].title}</span>
                      {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>Encrypted JWT Sessions • Server-side RBAC</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to MediCore</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your clinical or patient credentials to access your portal</p>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@medicore.health"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400 font-mono">Demo: Password123!</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#0F766E] hover:bg-[#0D655E] text-white py-3 px-4 rounded-xl text-sm font-semibold shadow-md shadow-teal-900/10 hover:shadow-teal-900/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New patient?</span>
            <Link href="/register" className="font-semibold text-[#0F766E] hover:underline">
              Create a Patient Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

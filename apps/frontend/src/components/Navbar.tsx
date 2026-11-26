'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  User, 
  ChevronDown, 
  Shield, 
  Check, 
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from './AuthContext';
import { UserRole } from '@medicore/shared';

export const Navbar: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const notifications = [
    { id: '1', title: 'Specialist Consultation Confirmed', time: '10m ago', unread: true },
    { id: '2', title: 'Automated Lab Profile Validated', time: '1h ago', unread: true },
    { id: '3', title: 'Prescription Dispensed at Pharmacy', time: '3h ago', unread: false }
  ];

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search patients, MRN, doctors, lab codes (e.g. LOINC)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 ml-auto">
        {/* Role Quick-Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 bg-teal-50 hover:bg-teal-100/70 border border-teal-200 text-[#0F766E] px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Switch Role: <strong>{user?.role || 'Guest'}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-[#0F766E]" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Active Persona
              </div>
              {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => {
                const isCurrent = user?.role === r;
                return (
                  <button
                    key={r}
                    onClick={async () => {
                      setShowRoleMenu(false);
                      await switchRole(r);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isCurrent ? 'font-bold text-[#0F766E] bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{DEMO_CREDENTIALS[r].title}</span>
                    {isCurrent && <Check className="w-4 h-4 text-[#0F766E]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] font-semibold text-[#0F766E]">2 New</span>
              </div>
              <div className="mt-2 space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {n.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0F766E] to-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
            </div>
            <div className="text-[10px] font-semibold text-slate-400">{user?.role || 'Sign In'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

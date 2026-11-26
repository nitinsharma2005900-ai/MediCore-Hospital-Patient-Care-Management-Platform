'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@medicore/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  patientProfileId?: string;
  doctorProfileId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  apiUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; title: string }> = {
  [UserRole.PATIENT]: { email: 'patient@medicore.health', pass: 'Password123!', title: 'Patient (Eleanor Vance)' },
  [UserRole.DOCTOR]: { email: 'doctor@medicore.health', pass: 'Password123!', title: 'Doctor (Dr. Fleming)' },
  [UserRole.RECEPTIONIST]: { email: 'receptionist@medicore.health', pass: 'Password123!', title: 'Receptionist (Clara Oswald)' },
  [UserRole.NURSE]: { email: 'nurse@medicore.health', pass: 'Password123!', title: 'Nurse (Florence Nightingale)' },
  [UserRole.LAB_TECHNICIAN]: { email: 'labtech@medicore.health', pass: 'Password123!', title: 'Lab Technician (Rosalind)' },
  [UserRole.BILLING_OFFICER]: { email: 'billing@medicore.health', pass: 'Password123!', title: 'Billing Officer (Warren Buffett)' },
  [UserRole.ADMIN]: { email: 'admin@medicore.health', pass: 'Password123!', title: 'Hospital Admin (Sarah Connor)' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('medicore_token');
    const savedUser = sessionStorage.getItem('medicore_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('medicore_token');
        sessionStorage.removeItem('medicore_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const u = data.data.user;
        const t = data.data.tokens.accessToken;
        setUser(u);
        setToken(t);
        sessionStorage.setItem('medicore_refresh', data.data.tokens.refreshToken);
        sessionStorage.setItem('medicore_token', t);
        sessionStorage.setItem('medicore_user', JSON.stringify(u));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = React.useCallback(() => {
    if (token) void fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    sessionStorage.removeItem('medicore_refresh');
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('medicore_token');
    sessionStorage.removeItem('medicore_user');
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setTimeout>;
    try {
      const expires = JSON.parse(atob(token.split('.')[1])).exp * 1000;
      timer = setTimeout(async () => {
        try {
          const response = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: sessionStorage.getItem('medicore_refresh') }) });
          const result = await response.json();
          if (!response.ok) { logout(); return; }
          setToken(result.data.accessToken);
          sessionStorage.setItem('medicore_token', result.data.accessToken);
          sessionStorage.setItem('medicore_refresh', result.data.refreshToken);
        } catch { logout(); }
      }, Math.max(1000, expires - Date.now() - 60000));
    } catch { logout(); }
    return () => clearTimeout(timer);
  }, [token, logout]);



  const switchRole = async (role: UserRole) => {
    const cred = DEMO_CREDENTIALS[role];
    if (cred) {
      await login(cred.email, cred.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole, apiUrl: API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const routes: Record<string,string> = { PATIENT:'patient', DOCTOR:'doctor', RECEPTIONIST:'receptionist', NURSE:'nurse', LAB_TECHNICIAN:'lab', BILLING_OFFICER:'billing', ADMIN:'admin' };
  const permitted = user && (pathname === '/dashboard' || pathname === `/dashboard/${routes[user.role]}`);
  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    else if (!isLoading && !permitted) router.replace('/dashboard');
  }, [user, isLoading, permitted, router]);
  if (!permitted) return <p role="status" className="p-8">Opening your workspace…</p>;
  return (
    <div className="flex h-[calc(100dvh-36px)] overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

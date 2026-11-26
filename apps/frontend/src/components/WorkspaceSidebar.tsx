'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Calendar, ClipboardList, HeartPulse, FlaskConical, CreditCard, BarChart3, BookOpen, LogOut, Menu, X, PanelLeftClose } from 'lucide-react';
import { useAuth } from './AuthContext';
const links = [
  { label: 'Workspace overview', href:'/dashboard', icon:Activity },
  { label: 'Book an appointment', href:'/appointments/book', icon:Calendar, roles:['PATIENT','RECEPTIONIST'] },
  { label: 'My care & records', href:'/dashboard/patient', icon:HeartPulse, roles:['PATIENT'] },
  { label: 'Clinical encounters', href:'/dashboard/doctor', icon:ClipboardList, roles:['DOCTOR'] },
  { label: 'Reception & check-in', href:'/dashboard/receptionist', icon:Calendar, roles:['RECEPTIONIST'] },
  { label: 'Assigned patient care', href:'/dashboard/nurse', icon:HeartPulse, roles:['NURSE'] },
  { label: 'Laboratory orders', href:'/dashboard/lab', icon:FlaskConical, roles:['LAB_TECHNICIAN'] },
  { label: 'Billing & invoices', href:'/dashboard/billing', icon:CreditCard, roles:['BILLING_OFFICER'] },
  { label: 'Hospital operations', href:'/dashboard/admin', icon:BarChart3, roles:['ADMIN'] },
];
export function Sidebar() {
  const {user,logout}=useAuth(); const pathname=usePathname();
  const [open,setOpen]=useState(false); const [collapsed,setCollapsed]=useState(false);
  useEffect(()=>{setOpen(false);},[pathname]);
  useEffect(()=>{ const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);}; document.addEventListener('keydown',escape); return()=>document.removeEventListener('keydown',escape); },[]);
  return <>
    <button aria-label="Open navigation" aria-expanded={open} onClick={()=>setOpen(true)} className="lg:hidden fixed top-[54px] left-4 p-2 bg-white text-teal-800 border rounded-lg z-30"><Menu size={20}/></button>
    {open && <button aria-label="Close navigation overlay" onClick={()=>setOpen(false)} className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40"/>}
    <aside aria-label="Main navigation" className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-30 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'} ${collapsed?'lg:w-20':'lg:w-64'} w-72 shrink-0`}>
      <div className="h-20 flex items-center gap-3 px-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-3" aria-label="MediCore workspace"><span className="bg-teal-700 rounded-xl p-2.5 text-white"><Activity size={22}/></span>{!collapsed&&<span className="text-xl font-bold tracking-tight">Medi<span className="text-teal-700">Core</span></span>}</Link>
        <button aria-label="Close navigation" onClick={()=>setOpen(false)} className="ml-auto lg:hidden p-1"><X size={18}/></button>
      </div>
      {!collapsed&&<div className="p-5 pb-2"><p className="text-xs uppercase tracking-widest text-slate-500">Your workspace</p><p className="font-semibold text-slate-900 mt-2 capitalize">{user?.role.toLowerCase().replaceAll('_',' ')}</p><p className="text-sm text-slate-500">{user?.firstName} {user?.lastName}</p></div>}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">{links.filter(l=>!l.roles||l.roles.includes(user?.role||'')).map(l=><Link key={l.label} href={l.href} title={l.label} aria-current={pathname===l.href?'page':undefined} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${pathname===l.href?'bg-teal-700 text-white':'text-slate-600 hover:bg-slate-50'}`}><l.icon size={19} className="shrink-0"/>{!collapsed&&l.label}</Link>)}
        <a href="/api-docs/" target="_blank" rel="noreferrer" title="API documentation" className="flex items-center gap-3 p-3 text-sm text-slate-500"><BookOpen size={19}/>{!collapsed&&'API documentation'}</a>
      </nav>
      <div className="p-3 border-t space-y-1">
        <button onClick={()=>setCollapsed(!collapsed)} aria-label="Toggle compact navigation" className="hidden lg:flex gap-3 p-3 text-sm text-slate-500"><PanelLeftClose size={19}/>{!collapsed&&'Compact navigation'}</button>
        <button onClick={logout} className="flex items-center gap-3 p-3 text-red-700 text-sm w-full rounded-xl hover:bg-red-50" aria-label="Sign out"><LogOut size={19}/>{!collapsed&&'Sign out'}</button>
      </div>
    </aside>
  </>;
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Search, Moon, Sun, ChevronDown } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from './AuthContext';
import { UserRole } from '@medicore/shared';
export function Navbar() {
  const {user,token,apiUrl,switchRole}=useAuth(); const router=useRouter(); const client=useQueryClient();
  const [notificationsOpen,setNotificationsOpen]=useState(false); const [rolesOpen,setRolesOpen]=useState(false);
  const [dark,setDark]=useState(false); const [search,setSearch]=useState('');
  const {data:notifications=[],error}=useQuery<any[]>({queryKey:['notifications',user?.id], enabled:!!token, queryFn:async()=>{
    const r=await fetch(`${apiUrl}/notifications`,{headers:{Authorization:`Bearer ${token}`}}); if(!r.ok)throw Error('Notifications unavailable'); const j=await r.json(); return Array.isArray(j.data)?j.data:j.data?.notifications||[];
  }});
  const {data:doctors=[]}=useQuery<any[]>({queryKey:['doctor-search',search],enabled:search.trim().length>1,queryFn:async()=>{
    const r=await fetch(`${apiUrl}/doctors?search=${encodeURIComponent(search)}`); if(!r.ok)throw Error('Search unavailable');return(await r.json()).data||[];
  }});
  useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key==='Escape'){setRolesOpen(false);setNotificationsOpen(false);setSearch('');}};document.addEventListener('keydown',f);return()=>document.removeEventListener('keydown',f);},[]);
  const unread=notifications.filter(n=>!n.readAt).length;
  return <header className="h-20 shrink-0 bg-white border-b border-slate-200 px-4 pl-16 lg:pl-6 sm:px-6 flex items-center justify-between gap-3 relative z-20">
    <div className="relative hidden md:block max-w-sm flex-1"><Search size={17} className="absolute top-3 left-3 text-slate-400"/><input aria-label="Find a doctor" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a doctor or specialty" className="w-full border bg-slate-50 rounded-xl py-2 pl-10 pr-3 text-sm"/>
      {search.length>1&&<div className="absolute top-full mt-2 w-full max-h-64 overflow-auto bg-white border shadow-lg rounded-xl p-2">{doctors.length?doctors.slice(0,8).map(d=><div key={d.id} className="p-2 border-b text-sm"><strong>{d.name}</strong><p className="text-slate-500">{d.specialization} · {d.departmentName}</p></div>):<p className="p-3 text-sm">No matching doctors</p>}</div>}
    </div>
    <div className="md:hidden font-semibold text-teal-800 text-sm">MediCore</div>
    <div className="flex items-center gap-2 ml-auto">
      <button aria-label={dark?'Use light theme':'Use dark theme'} onClick={()=>{setDark(!dark);document.documentElement.classList.toggle('dark',!dark);}} className="p-2 text-slate-500 rounded-lg hover:bg-slate-100">{dark?<Sun size={19}/>:<Moon size={19}/>}</button>
      <div className="relative"><button aria-label="Notifications" aria-expanded={notificationsOpen} onClick={()=>{setNotificationsOpen(!notificationsOpen);setRolesOpen(false);}} className="p-2 relative text-slate-500"><Bell size={20}/>{unread>0&&<span className="absolute -top-1 -right-1 bg-teal-700 text-white rounded-full text-xs px-1">{unread}</span>}</button>
        {notificationsOpen&&<section aria-label="Notification center" className="fixed sm:absolute right-3 sm:right-0 top-[112px] sm:top-full mt-2 w-[min(350px,calc(100vw-24px))] max-h-96 overflow-auto bg-white border shadow-xl rounded-2xl p-4"><h2 className="font-semibold mb-3">Notifications</h2>{error?<p role="alert">Notifications unavailable. Retry shortly.</p>:notifications.length?notifications.map(n=><button key={n.id} className="block text-left p-3 w-full rounded-xl bg-slate-50 mb-2" onClick={async()=>{await fetch(`${apiUrl}/notifications/${n.id}/read`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`}});void client.invalidateQueries({queryKey:['notifications',user?.id]});}}><span className="text-sm font-semibold">{n.title}</span><span className="block text-sm text-slate-500 mt-1">{n.message}</span><span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span></button>):<p className="text-sm text-slate-500">You’re all caught up.</p>}</section>}
      </div>
      <div className="relative"><button aria-label="Switch demo role" aria-expanded={rolesOpen} onClick={()=>{setRolesOpen(!rolesOpen);setNotificationsOpen(false);}} className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-800"><span className="font-semibold truncate max-w-[94px] sm:max-w-none">{user?.firstName}</span><ChevronDown size={14}/></button>
        {rolesOpen&&<div className="absolute right-0 top-full mt-2 w-64 bg-white border shadow-xl rounded-xl p-2"><p className="p-2 text-xs text-slate-500">Synthetic demo accounts</p>{(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map(r=><button key={r} className="block w-full text-left text-sm p-2 rounded-lg hover:bg-teal-50" onClick={async()=>{setRolesOpen(false);client.clear();await switchRole(r);router.push('/dashboard');}}>{DEMO_CREDENTIALS[r].title}</button>)}</div>}
      </div>
    </div>
  </header>;
}

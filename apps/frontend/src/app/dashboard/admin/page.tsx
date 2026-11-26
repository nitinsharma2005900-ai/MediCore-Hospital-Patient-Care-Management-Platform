'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Activity, 
  Users, 
  BarChart3, 
  ShieldCheck, 
  FileText, 
  CheckCircle, 
  Clock, 
  Search,
  Server,
  Database,
  Cpu
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { StaffManagement } from '@/components/OperationsTools';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function AdminDashboard() {
  const { token, apiUrl } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [searchLog, setSearchLog] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'departments' | 'audits'>('analytics');
  const [loading, setLoading] = useState(true);

  const ANALYTICS_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || '';

  useEffect(() => {
    async function loadAdminData() {
      if (!token) return;
      try {
        setLoading(true);

        // Fetch Audit Logs and Departments from Backend
        const [auditRes, deptRes] = await Promise.all([
          fetch(`${apiUrl}/audit?limit=100`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error("Operational data unavailable"); return r.json(); }),
          fetch(`${apiUrl}/departments`).then(r => { if (!r.ok) throw new Error("Operational data unavailable"); return r.json(); })
        ]);

        if (auditRes.success) setAuditLogs(auditRes.data || []);
        if (deptRes.success) setDepartments(deptRes.data || []);

        // Fetch real calculated analytics from FastAPI microservice
        try {
          const [utilRes, waitRes, tatRes, popRes, deptStatRes] = await Promise.all([
            fetch(`${ANALYTICS_URL}/analytics/appointment-utilization`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error("Operational data unavailable"); return r.json(); }),
            fetch(`${ANALYTICS_URL}/analytics/waiting-times`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error("Operational data unavailable"); return r.json(); }),
            fetch(`${ANALYTICS_URL}/analytics/lab-turnaround`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error("Operational data unavailable"); return r.json(); }),
            fetch(`${ANALYTICS_URL}/analytics/population-metrics`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error("Operational data unavailable"); return r.json(); }),
            fetch(`${ANALYTICS_URL}/analytics/department-statistics`, { headers: { Authorization: `Bearer ${token}` } }).then(r => { if (!r.ok) throw new Error("Operational data unavailable"); return r.json(); })
          ]);

          setAnalytics({
            utilization: utilRes.data,
            waitingTimes: waitRes.data,
            labTurnaround: tatRes.data,
            population: popRes.data,
            deptStats: deptStatRes.data
          });
        } catch (fastApiErr) {
          console.warn('FastAPI microservice not reachable, metrics unavailable', fastApiErr);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [token, apiUrl, ANALYTICS_URL]);

  const COLORS = ['#0F766E', '#2563EB', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];

  const filteredLogs = auditLogs.filter(l => 
    l.action?.toLowerCase().includes(searchLog.toLowerCase()) ||
    l.entityName?.toLowerCase().includes(searchLog.toLowerCase()) ||
    l.performedByUserName?.toLowerCase().includes(searchLog.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <StaffManagement />
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider bg-teal-800 text-teal-200 px-3 py-1 rounded-full">
            Hospital System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Executive Operations & Analytics</h1>
          <p className="text-xs text-slate-300 mt-1">Cross-department caseload, FastAPI quantitative metrics, and security audit log</p>
        </div>

        {/* Live Service Health Indicator */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center space-x-3 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="font-bold">{loading ? 'Connecting to operational data…' : analytics ? 'Analytics connected' : 'Analytics unavailable'}</div>
            <div className="text-[10px] text-teal-200">Based on authorized hospital records</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 gap-5 text-sm font-semibold [&>button]:shrink-0 [&>button]:whitespace-nowrap">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 transition-colors ${activeTab === 'analytics' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          FastAPI Clinical Analytics
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 transition-colors ${activeTab === 'departments' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Hospital Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('audits')}
          className={`pb-3 transition-colors ${activeTab === 'audits' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Immutable Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: FastAPI Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Quantitative Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Appointment Utilization</span>
              <div className="text-2xl font-black text-[#0F766E] mt-1">
                {analytics?.utilization ? <AnimatedNumber value={analytics.utilization.utilization_rate_percent} decimals={1}/> : '—'}%
              </div>
              <span className="text-[10px] text-teal-700 font-semibold">Slot Allocation Efficiency</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Avg Patient Wait Time</span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {analytics?.waitingTimes?.average_wait_minutes ?? '—'} <span className="text-sm font-normal text-slate-500">min</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold">P90: {analytics?.waitingTimes?.p90_wait_minutes ?? '—'} min</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Lab Turnaround Time</span>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {analytics?.labTurnaround?.average_tat_hours ?? '—'} <span className="text-sm font-normal text-slate-500">hrs</span>
              </div>
              <span className="text-[10px] text-purple-700 font-semibold">STAT: {analytics?.labTurnaround?.stat_urgent_average_minutes ?? '—'} min</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Synthetic Cohort</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {analytics?.population?.total_synthetic_patients ?? '—'}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">Median Age: {analytics?.population?.median_patient_age ?? '—'} yrs</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Caseload Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Department Caseload & Occupancy</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.deptStats || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="scheduledAppointments" fill="#0F766E" radius={[4, 4, 0, 0]} name="Scheduled" />
                    <Bar dataKey="completedEncounters" fill="#2563EB" radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demographic Distribution (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Synthetic Cohort Age Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics?.population?.age_distribution || {}).map(([name,value])=>({name,value:Number(value)}))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Departments */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Hospital Clinical Departments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div key={d.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0F766E]">{d.code}</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Active</span>
                </div>
                <h4 className="font-bold text-slate-900 mt-1">{d.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{d.description}</p>
                <div className="mt-3 text-[10px] text-slate-400">Location: {d.building || 'Not recorded'}, Floor {d.floor ?? 'Not recorded'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Audit Logs */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">System Security & Compliance Audit Log</h3>
              <p className="text-xs text-slate-500">Every sensitive record access, appointment creation, and consent update is immutably logged</p>
            </div>
            <input
              type="text"
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              placeholder="Search action, user, or entity..."
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Operator / Role</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-sans text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.action}</td>
                    <td className="py-2.5 px-3 text-teal-800 font-semibold font-sans">{log.entityName}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-semibold text-slate-800">{log.performedByUserName}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({log.userRole})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px] truncate max-w-xs">{log.requestCorrelationId || 'req-id'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


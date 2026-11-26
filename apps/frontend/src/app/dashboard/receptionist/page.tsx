'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Search, 
  CheckCircle, 
  Calendar, 
  Clock, 
  UserCheck, 
  AlertCircle,
  Plus,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function ReceptionistDashboard() {
  const { token, apiUrl } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/appointments?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token, apiUrl]);

  const handleCheckIn = async (aptId: string) => {
    try {
      const res = await fetch(`${apiUrl}/appointments/${aptId}/check-in`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Patient marked as arrived and checked in.');
        fetchAppointments();
      } else {
        setStatusMsg(data.error?.message || 'Check-in failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (aptId: string) => {
    const reason = prompt('Please enter cancellation reason:', 'Patient schedule change request');
    if (!reason) return;

    try {
      const res = await fetch(`${apiUrl}/appointments/${aptId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cancellationReason: reason })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Appointment cancelled.');
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAppointments = appointments.filter(a => 
    a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    a.patientMrn?.toLowerCase().includes(search.toLowerCase()) ||
    a.doctorName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider bg-indigo-800 text-indigo-200 px-3 py-1 rounded-full">
            Reception & Front Desk Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Patient Check-In & Admissions</h1>
          <p className="text-xs text-indigo-200 mt-1">Coordinate daily arrival queues, provider availability, and patient scheduling</p>
        </div>

        <Link
          href="/appointments/book"
          className="bg-white hover:bg-indigo-50 text-indigo-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center space-x-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Appointment</span>
        </Link>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Roster & Search Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by patient name, MRN, or doctor..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchAppointments}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient / MRN</th>
                <th className="py-3 px-4">Consultant</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{apt.patientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{apt.patientMrn}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    <div>{apt.doctorName}</div>
                    <div className="text-[10px] text-slate-400">{apt.doctorSpecialization}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div>{new Date(apt.scheduledStartTime).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">{new Date(apt.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      apt.status === 'CHECKED_IN' ? 'bg-amber-100 text-amber-800' :
                      apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate">{apt.reason}</td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {apt.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCheckIn(apt.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs"
                      >
                        Check In
                      </button>
                    )}
                    {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="text-red-600 hover:bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

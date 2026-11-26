'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Building2, 
  ArrowLeft,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function BookAppointmentPage() {
  const router = useRouter();
  const { user, token, apiUrl } = useAuth();

  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoc, setSelectedDoc] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-11-28');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [reason, setReason] = useState('Comprehensive clinical consultation & cardiovascular review');
  const [priority, setPriority] = useState('NORMAL');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load departments
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await fetch(`${apiUrl}/departments`);
        const data = await res.json();
        if (data.success && data.data) {
          setDepartments(data.data);
          if (data.data.length > 0) setSelectedDept(data.data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadDepts();
  }, [apiUrl]);

  // Load doctors filtered by department
  useEffect(() => {
    async function loadDocs() {
      try {
        const url = selectedDept ? `${apiUrl}/doctors?departmentId=${selectedDept}` : `${apiUrl}/doctors`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.data) {
          setDoctors(data.data);
          if (data.data.length > 0) {
            setSelectedDoc(data.data[0].id);
          } else {
            setSelectedDoc('');
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadDocs();
  }, [selectedDept, apiUrl]);

  // Fetch available slots for doctor & date
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDoc || !selectedDate) return;
      try {
        setLoadingSlots(true);
        setSelectedSlot(null);
        const res = await fetch(`${apiUrl}/doctors/${selectedDoc}/available-slots?date=${selectedDate}`);
        const data = await res.json();
        if (data.success && data.data) {
          setAvailableSlots(data.data);
          if (data.data.length > 0) setSelectedSlot(data.data[0]);
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedDoc, selectedDate, apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please choose an available appointment time slot.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: selectedDoc,
          departmentId: selectedDept,
          scheduledStartTime: selectedSlot.startTime,
          scheduledEndTime: selectedSlot.endTime,
          type: 'ROUTINE',
          reason,
          priority
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Appointment booked successfully! Reference: ${data.data.appointmentNumber}`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(data.error?.message || 'Failed to book appointment.');
      }
    } catch {
      setError('Network communication failure. Please verify server status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <Link href="/dashboard" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-6 mb-6">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Concurrency-Protected Clinic Booking</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Schedule Specialist Consultation</h1>
          <p className="text-xs text-slate-500 mt-1">Select department, physician, and real-time available 30-minute clinical window</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-xs text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">1. Clinical Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">2. Consulting Physician</label>
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialization} (${doc.consultationFee})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">3. Select Appointment Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          {/* Slots Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              4. Available 30-Minute Time Slots ({availableSlots.length} Open)
            </label>

            {loadingSlots ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading doctor clinic availability...</div>
            ) : availableSlots.length === 0 ? (
              <div className="py-6 text-center text-xs text-amber-600 bg-amber-50 rounded-2xl border border-amber-200">
                No slots open for selected date. Please pick a Monday - Friday date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center space-x-1 ${
                        isSelected 
                          ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">5. Clinical Reason for Visit</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Database Transactional Concurrency Lock Active
            </span>
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="bg-[#0F766E] hover:bg-[#0D655E] text-white px-8 py-3 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Locking slot & reserving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm Appointment Reservation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

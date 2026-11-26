'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  FileText, 
  FlaskConical, 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function PatientDashboard() {
  const { user, token, apiUrl } = useAuth();
  const [activeTab, setActiveTab] = useState<'appointments' | 'prescriptions' | 'labs' | 'billing' | 'consent'>('appointments');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatientData() {
      if (!token) return;
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch in parallel
        const [aptRes, rxRes, labRes, invRes] = await Promise.all([
          fetch(`${apiUrl}/appointments`, { headers }).then(r => r.json()),
          fetch(`${apiUrl}/prescriptions`, { headers }).then(r => r.json()),
          fetch(`${apiUrl}/lab/orders`, { headers }).then(r => r.json()),
          fetch(`${apiUrl}/billing/invoices`, { headers }).then(r => r.json())
        ]);

        if (aptRes.success) setAppointments(aptRes.data || []);
        if (rxRes.success) setPrescriptions(rxRes.data || []);
        if (labRes.success) setLabs(labRes.data || []);
        if (invRes.success) setInvoices(invRes.data || []);

        if (user?.patientProfileId) {
          const consentRes = await fetch(`${apiUrl}/consent/patient/${user.patientProfileId}`, { headers }).then(r => r.json());
          if (consentRes.success) setConsents(consentRes.data || []);
        }
      } catch (err) {
        console.error('Error loading patient dashboard', err);
      } finally {
        setLoading(false);
      }
    }

    loadPatientData();
  }, [token, apiUrl, user]);

  const handlePayInvoice = async (invoiceId: string, amount: number) => {
    try {
      const res = await fetch(`${apiUrl}/billing/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceId,
          amount,
          paymentMethod: 'SIMULATED'
        })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh invoices
        const invRes = await fetch(`${apiUrl}/billing/invoices`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        if (invRes.success) setInvoices(invRes.data || []);
      }
    } catch (err) {
      console.error('Payment error', err);
    }
  };

  const handleToggleConsent = async (consentType: string, currentGranted: boolean) => {
    if (!user?.patientProfileId) return;
    try {
      const res = await fetch(`${apiUrl}/consent/patient/${user.patientProfileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          consentType,
          granted: !currentGranted,
          revocationReason: currentGranted ? 'Patient toggled off in settings' : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        const consentRes = await fetch(`${apiUrl}/consent/patient/${user.patientProfileId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        if (consentRes.success) setConsents(consentRes.data || []);
      }
    } catch (err) {
      console.error('Consent error', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider bg-teal-700/80 text-teal-200 px-3 py-1 rounded-full">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Welcome back, {user?.firstName} {user?.lastName}</h1>
          <p className="text-xs text-teal-100 mt-1 flex items-center gap-3">
            <span>MRN: <strong className="font-mono text-white">MRN-2026-0001</strong></span>
            <span>•</span>
            <span>Blood Group: <strong className="text-white">O+</strong></span>
            <span>•</span>
            <span>Insurance: <strong className="text-white">Blue Cross Blue Shield</strong></span>
          </p>
        </div>

        <Link
          href="/appointments/book"
          className="bg-white hover:bg-teal-50 text-[#0F766E] px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center space-x-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Book Specialist</span>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Appointments</span>
            <Calendar className="w-4 h-4 text-[#0F766E]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{appointments.length}</div>
          <span className="text-[10px] text-teal-600 font-medium">Scheduled & Past</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Prescriptions</span>
            <FileText className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{prescriptions.length}</div>
          <span className="text-[10px] text-blue-600 font-medium">Active Regimens</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Lab Orders</span>
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{labs.length}</div>
          <span className="text-[10px] text-purple-600 font-medium">Diagnostic Panels</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Due Balance</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${invoices.reduce((acc, i) => acc + (i.balanceAmount || 0), 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Simulated Billing</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 transition-colors ${activeTab === 'appointments' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          My Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 transition-colors ${activeTab === 'prescriptions' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Prescriptions ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`pb-3 transition-colors ${activeTab === 'labs' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Diagnostic Results ({labs.length})
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 transition-colors ${activeTab === 'billing' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Billing & Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('consent')}
          className={`pb-3 transition-colors ${activeTab === 'consent' ? 'text-[#0F766E] border-b-2 border-[#0F766E]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Privacy & Consents
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Fetching medical records...</span>
          </div>
        ) : (
          <>
            {/* 1. Appointments */}
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No appointments on record. Click "Book Specialist" above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Appointment #</th>
                          <th className="py-3 px-4">Doctor & Specialty</th>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {appointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{apt.appointmentNumber}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{apt.doctorName}</div>
                              <div className="text-[10px] text-slate-400">{apt.doctorSpecialization}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div>{new Date(apt.scheduledStartTime).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-400">{new Date(apt.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                apt.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                apt.status === 'CHECKED_IN' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                apt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs truncate">{apt.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 2. Prescriptions */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                {prescriptions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">No active prescriptions found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions.map((rx) => (
                      <div key={rx.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#0F766E]">{rx.prescriptionNumber}</span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{rx.status}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Prescribing Doctor: {rx.doctorName}</div>
                        <div className="mt-3 space-y-2">
                          {rx.items?.map((item: any) => (
                            <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                              <div className="font-bold text-slate-900">{item.medicationName} ({item.dosage})</div>
                              <div className="text-slate-500 mt-0.5">{item.frequency} • {item.durationDays} days supply</div>
                              {item.precautions && <div className="text-[11px] text-amber-600 mt-1">Note: {item.precautions}</div>}
                            </div>
                          ))}
                        </div>
                        {rx.instructions && (
                          <div className="mt-3 text-[11px] text-slate-500 italic">Instructions: {rx.instructions}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Labs */}
            {activeTab === 'labs' && (
              <div className="space-y-4">
                {labs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">No diagnostic lab orders recorded.</div>
                ) : (
                  <div className="space-y-4">
                    {labs.map((order) => (
                      <div key={order.id} className="border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-purple-700">{order.orderNumber}</span>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{order.testPanelName}</h3>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {order.results && order.results.length > 0 && (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="text-[10px] uppercase text-slate-400 font-bold">
                                <tr>
                                  <th className="py-1">Biomarker / Test</th>
                                  <th className="py-1">LOINC</th>
                                  <th className="py-1">Measured Value</th>
                                  <th className="py-1">Reference Interval</th>
                                  <th className="py-1">Interpretation</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {order.results.map((r: any) => (
                                  <tr key={r.id}>
                                    <td className="py-2 font-semibold text-slate-800">{r.testName}</td>
                                    <td className="py-2 font-mono text-slate-400">{r.testCode}</td>
                                    <td className="py-2 font-bold text-slate-900">{r.measuredValue} {r.unit}</td>
                                    <td className="py-2 text-slate-500">{r.referenceRangeLow || '0'} - {r.referenceRangeHigh || 'N/A'} {r.unit}</td>
                                    <td className="py-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        r.interpretation === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {r.interpretation}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Billing */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">No invoices found.</div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Issued: {new Date(inv.issuedAt).toLocaleDateString()} • Items: {inv.itemsCount || 1}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">${inv.totalAmount.toFixed(2)}</div>
                            <div className="text-[11px] text-slate-500">Balance: ${inv.balanceAmount.toFixed(2)}</div>
                          </div>

                          {inv.balanceAmount > 0 && (
                            <button
                              onClick={() => handlePayInvoice(inv.id, inv.balanceAmount)}
                              className="bg-[#0F766E] hover:bg-[#0D655E] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              Simulate Pay (${inv.balanceAmount})
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. Privacy & Consents */}
            {activeTab === 'consent' && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Patient Consent & Data Authorization Directives</h3>
                  <p className="text-xs text-slate-500">MediCore enforces patient consent rules server-side. Revoking permission prevents non-emergency record sharing.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { type: 'GENERAL_CARE', title: 'General Inpatient & Outpatient Clinical Treatment', desc: 'Allows attending clinicians and nursing staff to treat you and access current encounter vitals.' },
                    { type: 'CLINICAL_DATA_SHARING', title: 'Hospital Network Electronic Health Record Sharing', desc: 'Authorizes inter-departmental transfer of clinical diagnoses, histories, and specialist notes.' },
                    { type: 'LAB_DATA_ACCESS', title: 'Automated Diagnostic Laboratory Profile Sharing', desc: 'Grants certified pathologists and lab specialists rights to process your medical specimens.' },
                    { type: 'RESEARCH', title: 'De-identified Synthetic Research Cohort Participation', desc: 'Includes anonymized operational metrics in academic population health research models.' }
                  ].map((item) => {
                    const record = consents.find(c => c.consentType === item.type);
                    const isGranted = record ? (record.granted && !record.revokedAt) : true;

                    return (
                      <div key={item.type} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>

                        <button
                          onClick={() => handleToggleConsent(item.type, isGranted)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isGranted ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isGranted ? 'Granted' : 'Revoked'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

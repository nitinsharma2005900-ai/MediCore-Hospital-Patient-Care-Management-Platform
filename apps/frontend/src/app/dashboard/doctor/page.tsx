'use client';

import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Users, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle, 
  FileText, 
  FlaskConical, 
  AlertCircle,
  Search
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function DoctorDashboard() {
  const { user, token, apiUrl } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<any | null>(null);

  // Form states for clinical encounter
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [icdCode, setIcdCode] = useState('I10');
  const [icdDesc, setIcdDesc] = useState('Essential (primary) hypertension');
  const [medName, setMedName] = useState('Lisinopril');
  const [dosage, setDosage] = useState('10mg');
  const [frequency, setFrequency] = useState('Once daily');
  const [durationDays, setDurationDays] = useState(30);
  const [labPanel, setLabPanel] = useState('Comprehensive Metabolic Panel (CMP)');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctorSchedule() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAppointments(data.data || []);
          if (data.data?.length > 0) {
            setSelectedApt(data.data[0]);
            setChiefComplaint(data.data[0].reason || '');
          }
        }
      } catch (err) {
        console.error('Doctor schedule fetch error', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctorSchedule();
  }, [token, apiUrl]);

  const handleStartEncounter = async () => {
    if (!selectedApt) return;
    try {
      const res = await fetch(`${apiUrl}/encounters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: selectedApt.id,
          patientId: selectedApt.patientId,
          chiefComplaint: chiefComplaint || selectedApt.reason,
          clinicalNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveEncounter(data.data);
        setStatusMsg('Encounter initiated. You can now add diagnoses, prescriptions, and lab orders.');
      } else {
        setStatusMsg(data.error?.message || 'Failed to start encounter.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDiagnosis = async () => {
    if (!activeEncounter) return;
    try {
      const res = await fetch(`${apiUrl}/encounters/diagnoses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          encounterId: activeEncounter.id,
          patientId: activeEncounter.patientId,
          icdCode,
          icdDescription: icdDesc,
          type: 'PRIMARY',
          confidence: 'CONFIRMED'
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Diagnosis '${icdCode} - ${icdDesc}' successfully recorded.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPrescription = async () => {
    if (!activeEncounter) return;
    try {
      const res = await fetch(`${apiUrl}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          encounterId: activeEncounter.id,
          patientId: activeEncounter.patientId,
          instructions: 'Take medication as directed.',
          items: [{
            medicationName: medName,
            dosage,
            route: 'Oral',
            frequency,
            durationDays: Number(durationDays),
            quantity: 30
          }]
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Prescription '${medName} ${dosage}' successfully issued.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderLab = async () => {
    if (!activeEncounter) return;
    try {
      const res = await fetch(`${apiUrl}/lab/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          encounterId: activeEncounter.id,
          patientId: activeEncounter.patientId,
          testPanelName: labPanel,
          priority: 'ROUTINE',
          clinicalIndication: 'Routine monitoring'
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Lab Order '${labPanel}' dispatched to Laboratory workstation.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteEncounter = async () => {
    if (!activeEncounter) return;
    try {
      const res = await fetch(`${apiUrl}/encounters/${activeEncounter.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ clinicalNotes })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Clinical encounter concluded and finalized.');
        setActiveEncounter(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider bg-blue-800 text-blue-200 px-3 py-1 rounded-full">
            Attending Physician Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Dr. {user?.firstName} {user?.lastName}</h1>
          <p className="text-xs text-blue-200 mt-1">Specialization: Cardiology • Board License: MED-10001 • Clinic Suite 101</p>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-2xl font-bold">{appointments.length}</div>
          <div className="text-xs text-blue-300">Total Consultations</div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold text-xs">✕</button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Today's Patient Schedule (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col h-[650px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Patient Consultation Queue</h2>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {appointments.length} Records
            </span>
          </div>

          <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
            {appointments.map((apt) => {
              const isSelected = selectedApt?.id === apt.id;
              return (
                <div
                  key={apt.id}
                  onClick={() => {
                    setSelectedApt(apt);
                    setChiefComplaint(apt.reason || '');
                  }}
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-[#2563EB] bg-blue-50/50 shadow-xs' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{apt.patientName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      apt.status === 'CHECKED_IN' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span className="font-mono">{apt.patientMrn}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(apt.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 truncate italic">"{apt.reason}"</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Active Clinical Encounter (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">EHR Clinical Workspace</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedApt ? selectedApt.patientName : 'Select a Patient'}
                </h2>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedApt ? `MRN: ${selectedApt.patientMrn} • Ref: ${selectedApt.appointmentNumber}` : ''}
                </div>
              </div>

              {!activeEncounter ? (
                <button
                  onClick={handleStartEncounter}
                  disabled={!selectedApt}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  Start Encounter
                </button>
              ) : (
                <button
                  onClick={handleCompleteEncounter}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Conclude Consultation
                </button>
              )}
            </div>

            {/* Clinical Forms */}
            <div className="mt-4 space-y-4">
              {/* Chief Complaint & Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint & Subjective Findings</label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Clinical Notes / Objective Assessment</label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Review of systems, physical examination, and assessment plan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              {/* Action Panels: Diagnosis, Rx, Labs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* 1. Add Diagnosis */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">ICD-10 Diagnosis</span>
                  <select
                    value={icdCode}
                    onChange={(e) => {
                      setIcdCode(e.target.value);
                      if (e.target.value === 'I10') setIcdDesc('Essential hypertension');
                      if (e.target.value === 'E11.9') setIcdDesc('Type 2 diabetes mellitus');
                      if (e.target.value === 'M54.5') setIcdDesc('Low back pain');
                      if (e.target.value === 'J06.9') setIcdDesc('Acute upper respiratory infection');
                    }}
                    className="w-full mt-1.5 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="I10">I10 - Hypertension</option>
                    <option value="E11.9">E11.9 - Type 2 Diabetes</option>
                    <option value="M54.5">M54.5 - Low Back Pain</option>
                    <option value="J06.9">J06.9 - Acute URI</option>
                  </select>
                  <button
                    onClick={handleAddDiagnosis}
                    disabled={!activeEncounter}
                    className="w-full mt-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Record Diagnosis
                  </button>
                </div>

                {/* 2. Issue Rx */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Prescription Rx</span>
                  <select
                    value={medName}
                    onChange={(e) => {
                      setMedName(e.target.value);
                      if (e.target.value === 'Lisinopril') setDosage('10mg');
                      if (e.target.value === 'Metformin') setDosage('500mg');
                      if (e.target.value === 'Amoxicillin') setDosage('500mg');
                    }}
                    className="w-full mt-1.5 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="Lisinopril">Lisinopril (10mg)</option>
                    <option value="Metformin">Metformin (500mg)</option>
                    <option value="Amoxicillin">Amoxicillin (500mg)</option>
                  </select>
                  <button
                    onClick={handleAddPrescription}
                    disabled={!activeEncounter}
                    className="w-full mt-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Issue Prescription
                  </button>
                </div>

                {/* 3. Requisition Lab */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Diagnostic Lab</span>
                  <select
                    value={labPanel}
                    onChange={(e) => setLabPanel(e.target.value)}
                    className="w-full mt-1.5 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="Comprehensive Metabolic Panel (CMP)">CMP Panel</option>
                    <option value="Complete Blood Count (CBC)">CBC Panel</option>
                    <option value="Lipid Profile">Lipid Profile</option>
                    <option value="Hemoglobin A1c">HbA1c</option>
                  </select>
                  <button
                    onClick={handleOrderLab}
                    disabled={!activeEncounter}
                    className="w-full mt-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold py-1.5 rounded-lg disabled:opacity-50"
                  >
                    Order Lab Panel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>Server-side Consent Enforced</span>
            <span>FHIR R4 Observable Event</span>
          </div>
        </div>
      </div>
    </div>
  );
}

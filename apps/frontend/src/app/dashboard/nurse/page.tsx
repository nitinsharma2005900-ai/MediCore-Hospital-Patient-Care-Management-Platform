'use client';

import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Thermometer, 
  Scale, 
  Wind 
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function NurseDashboard() {
  const { token, apiUrl } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // Vitals state
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [heartRate, setHeartRate] = useState(72);
  const [respiratoryRate, setRespiratoryRate] = useState(16);
  const [temperature, setTemperature] = useState(36.8);
  const [spo2, setSpo2] = useState(98);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(72);
  const [notes, setNotes] = useState('Patient alert, oriented x4, resting comfortably.');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Auto-calculated BMI
  const bmi = heightCm > 0 && weightKg > 0 
    ? (weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1) 
    : '23.5';

  useEffect(() => {
    async function loadCheckedIn() {
      if (!token) return;
      try {
        const res = await fetch(`${apiUrl}/appointments`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.data) {
          const list = data.data.filter((a: any) => a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS');
          setAppointments(list);
          if (list.length > 0) setSelectedPatient(list[0]);

        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCheckedIn();
  }, [token, apiUrl]);

  const handleRecordVitals = async () => {
    if (!selectedPatient) return;
    try {
      // First ensure encounter exists or create/use encounter
      let encId = selectedPatient.encounterId;
      if (!encId) {
        setStatusMsg('Patient encounter not ready yet.');
        return;
      }

      const res = await fetch(`${apiUrl}/encounters/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          encounterId: encId,
          patientId: selectedPatient.patientId,
          systolicBp: Number(systolic),
          diastolicBp: Number(diastolic),
          heartRate: Number(heartRate),
          respiratoryRate: Number(respiratoryRate),
          temperature: Number(temperature),
          oxygenSaturation: Number(spo2),
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Vitals captured for ${selectedPatient.patientName} (BMI: ${bmi}). Saved to EHR.`);
      } else {
        setStatusMsg(data.error?.message || 'Error recording vitals.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider bg-emerald-800 text-emerald-200 px-3 py-1 rounded-full">
            Clinical Nursing Station
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Triage & Biometric Vitals Station</h1>
          <p className="text-xs text-emerald-200 mt-1">Capture clinical vitals and assist attending physicians</p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
          <button aria-label="Dismiss message" onClick={() => setStatusMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Triage Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs h-[580px] flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Triage Queue</h2>
          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => setSelectedPatient(apt)}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                  selectedPatient?.id === apt.id ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-900">{apt.patientName}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{apt.patientMrn}</div>
                <div className="text-[11px] text-slate-500 mt-1">Dr: {apt.doctorName}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vitals Form (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Patient Biometric Capture</span>
              <h3 className="text-lg font-bold text-slate-900">{selectedPatient ? selectedPatient.patientName : 'Select Patient'}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Calculated BMI</span>
              <div className="text-xl font-black text-emerald-700">{bmi} <span className="text-xs font-normal text-slate-400">kg/m²</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
              <input aria-label="Systolic BP (mmHg)"
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
              <input aria-label="Diastolic BP (mmHg)"
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
              <input aria-label="Heart Rate (bpm)"
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Oxygen Saturation (SpO2 %)</label>
              <input aria-label="Oxygen Saturation (SpO2 %)"
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature (°C)</label>
              <input aria-label="Temperature (°C)"
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Respiratory Rate (/min)</label>
              <input aria-label="Respiratory Rate (/min)"
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
              <input aria-label="Height (cm)"
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input aria-label="Weight (kg)"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Triage Observation Notes</label>
            <input aria-label="Triage Observation Notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <button
            onClick={handleRecordVitals}
            disabled={!selectedPatient}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Activity className="w-4 h-4" />
            <span>Save & Transmit Vitals to Attending Physician</span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FlaskConical, 
  CheckCircle, 
  Search, 
  AlertCircle, 
  Filter, 
  Clock, 
  CheckCheck,
  Send
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';

export default function LabDashboard() {
  const { token, apiUrl } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Result entry state
  const [testName, setTestName] = useState('Serum Creatinine');
  const [testCode, setTestCode] = useState('2160-0');
  const [measuredValue, setMeasuredValue] = useState('0.92');
  const [unit, setUnit] = useState('mg/dL');
  const [refLow, setRefLow] = useState('0.60');
  const [refHigh, setRefHigh] = useState('1.20');
  const [interpretation, setInterpretation] = useState('NORMAL');
  const [remarks, setRemarks] = useState('Automated analyzer calibration validated.');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/lab/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data);
        setSelectedOrder((current: any) => current || data.data.find((o: any) => o.status !== 'COMPLETED') || data.data[0] || null);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleEnterResult = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`${apiUrl}/lab/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          labOrderId: selectedOrder.id,
          patientId: selectedOrder.patientId,
          testName,
          testCode,
          measuredValue,
          unit,
          referenceRangeLow: refLow,
          referenceRangeHigh: refHigh,
          interpretation,
          specimenType: 'Blood - Serum',
          remarks
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Result for '${testName}' recorded under preliminary status.`);
        fetchOrders();
      } else {
        setStatusMsg(data.error?.message || 'Error saving result.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider bg-purple-800 text-purple-200 px-3 py-1 rounded-full">
            Clinical Pathology & Biochemistry
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Diagnostic Laboratory Workstation</h1>
          <p className="text-xs text-purple-200 mt-1">Manage diagnostic requisitions, calibrate analyzers, and log verified findings</p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span>{statusMsg}</span>
          <button aria-label="Dismiss message" onClick={() => setStatusMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orders Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col h-[600px]">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Requisition Queue ({orders.length})</h2>
          <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                  selectedOrder?.id === o.id ? 'border-purple-600 bg-purple-50/40 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-700">{o.orderNumber}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    o.priority === 'STAT' ? 'bg-red-100 text-red-800' :
                    o.priority === 'URGENT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {o.priority}
                  </span>
                </div>
                <div className="font-bold text-slate-900 mt-1">{o.testPanelName}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Patient: {o.patientName} ({o.patientMrn})</div>
                <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>Ordered by {o.doctorName}</span>
                  <span className="font-bold text-purple-700">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enter Findings Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Specimen Analysis Form</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {selectedOrder ? `${selectedOrder.testPanelName} • ${selectedOrder.orderNumber}` : 'Select Requisition'}
              </h3>
              <div className="text-xs text-slate-400 font-mono">
                {selectedOrder ? `Patient: ${selectedOrder.patientName} (${selectedOrder.patientMrn})` : ''}
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test / Analyte Name</label>
                <input aria-label="Test / Analyte Name"
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LOINC Standard Code</label>
                <input aria-label="LOINC Standard Code"
                  type="text"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Measured Value</label>
                <input aria-label="Measured Value"
                  type="text"
                  value={measuredValue}
                  onChange={(e) => setMeasuredValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                <input aria-label="Unit of Measure"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Low</label>
                <input aria-label="Reference Low"
                  type="text"
                  value={refLow}
                  onChange={(e) => setRefLow(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference High</label>
                <input aria-label="Reference High"
                  type="text"
                  value={refHigh}
                  onChange={(e) => setRefHigh(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Interpretation</label>
              <select aria-label="Clinical Interpretation"
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
              >
                <option value="NORMAL">NORMAL - Within expected physiological bounds</option>
                <option value="HIGH">HIGH - Elevated above normal range</option>
                <option value="LOW">LOW - Below expected normal range</option>
                <option value="CRITICAL">CRITICAL - Severe alert threshold</option>
                <option value="ABNORMAL">ABNORMAL - Atypical morphology / findings</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Technician Remarks & Instrument Notes</label>
              <input aria-label="Technician Remarks & Instrument Notes"
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <button
              onClick={handleEnterResult}
              disabled={!selectedOrder}
              className="mt-6 w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit Finding for Physician Validation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

export const DemoNotice: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white text-xs px-4 py-2 flex items-center justify-between border-b border-teal-600/40 shadow-sm z-50">
      <div className="flex items-center space-x-2 overflow-hidden text-ellipsis whitespace-nowrap">
        <ShieldAlert className="w-4 h-4 text-amber-300 flex-shrink-0 animate-pulse" />
        <span className="font-semibold tracking-wide">EDUCATIONAL DEMO NOTICE:</span>
        <span className="text-teal-100 hidden sm:inline">
          MediCore uses 100% fictional synthetic data. No real patient records, medical diagnoses, or real payments are processed.
        </span>
      </div>
      <button 
        onClick={() => setDismissed(true)} 
        className="text-teal-200 hover:text-white ml-2 transition-colors focus:outline-none"
        aria-label="Dismiss disclaimer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

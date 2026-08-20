import React, { useState } from 'react';
import { Settings, Sliders, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ConfigurationPage: React.FC = () => {
  const [toggles, setToggles] = useState({
    offlineSync: true,
    aiAssistant: true,
    strictRbac: true,
    realtimeSync: true,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles({ ...toggles, [key]: !toggles[key] });
    toast.success('Konfigurasi sistem diperbarui.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Configuration & Feature Toggles</span>
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          Pengaturan global sistem, feature flags, dan konfigurasi environment enterprise.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Offline-First Delta Synchronization</h4>
            <p className="text-xs text-slate-500">Sinkronisasi otomatis latar belakang menggunakan Dexie & Sync Engine</p>
          </div>
          <button
            onClick={() => handleToggle('offlineSync')}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
              toggles.offlineSync ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                toggles.offlineSync ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Assistant & Gemini Engine</h4>
            <p className="text-xs text-slate-500">Asisten cerdas berbasis server-side @google/genai SDK</p>
          </div>
          <button
            onClick={() => handleToggle('aiAssistant')}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
              toggles.aiAssistant ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                toggles.aiAssistant ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Strict RBAC Enforcement</h4>
            <p className="text-xs text-slate-500">Evaluasi peran mutlak pada service layer</p>
          </div>
          <button
            onClick={() => handleToggle('strictRbac')}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
              toggles.strictRbac ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                toggles.strictRbac ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

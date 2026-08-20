import React from 'react';
import { Activity, Cpu, Server, Zap } from 'lucide-react';

export const MonitoringPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>System Monitoring & Firestore Cost</span>
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          Pantau penggunaan resource Firestore, read/write cost reduction, dan performa real-time listeners.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Firestore Cost Optimization</h3>
          <p className="text-xs text-slate-500 mb-4">Pengurangan pembacaan Firestore melalui Delta Sync & Summary Collections.</p>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            78% Lebih Hemat dibanding Naive Read
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Realtime Listeners</h3>
          <p className="text-xs text-slate-500 mb-4">Jumlah aktif listener terdaftar pada Realtime Hub.</p>
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
            2 Active Listeners (Optimized)
          </div>
        </div>
      </div>
    </div>
  );
};

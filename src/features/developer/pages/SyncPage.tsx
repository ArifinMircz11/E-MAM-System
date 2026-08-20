import React from 'react';
import { RefreshCw, CheckCircle, Server, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const SyncPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <RefreshCw className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Sync Center & Queue Engine</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Pengelolaan antrean sinkronisasi offline (Sync Queue), Delta Sync, dan penanganan conflict resolution.
          </p>
        </div>
        <button
          onClick={() => toast.success('Sinkronisasi paksa dijalankan.')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Force Sync Now</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Status Sync Engine</h3>
            <p className="text-xs text-slate-500">Koneksi dan antrean mutasi data offline</p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle className="w-4 h-4" />
            <span>Sync Engine Active (0 Pending)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Queue Terproses</p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white">1,420</h4>
          </div>
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dead Letter Queue</p>
            <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">0</h4>
          </div>
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Conflict Resolution</p>
            <h4 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Auto-Merge</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

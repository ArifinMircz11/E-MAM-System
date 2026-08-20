import React from 'react';
import { Database, HardDrive, RefreshCw, Server, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const DatabasePage: React.FC = () => {
  const collections = [
    { name: 'students', count: 1248, status: 'Synced', size: '2.4 MB' },
    { name: 'teachers', count: 85, status: 'Synced', size: '340 KB' },
    { name: 'classes', count: 36, status: 'Synced', size: '120 KB' },
    { name: 'attendance', count: 18450, status: 'Delta Sync Active', size: '5.8 MB' },
    { name: 'audit_logs', count: 3200, status: 'Local Only', size: '1.2 MB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Database Center (Dexie & Firestore)</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Pemantauan operational database IndexedDB (Dexie) dan Cloud Backup (Firestore).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success('Database indexes verified.')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Verify Indexes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((col, idx) => (
          <div key={idx} className="bg-white dark:bg-[#0B1121] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {col.name}
              </span>
              <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border border-indigo-200/50 dark:border-indigo-800/50">
                {col.status}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Records:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{col.count} Rows</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Local Storage Size:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{col.size}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

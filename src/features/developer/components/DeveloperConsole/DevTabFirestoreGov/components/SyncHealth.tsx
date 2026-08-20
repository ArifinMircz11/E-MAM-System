import React from 'react';

/**
 * SYNC HEALTH COMPONENT
 * 
 * Modul untuk memantau kesehatan pipa sinkronisasi antara Dexie dan Firestore.
 * Memberikan visibilitas terhadap antrean (queue) yang tertunda dan kinerja sinkronisasi.
 */

interface SyncStats {
  pendingCount: number;
  dlqCount: number;
  retryCount: number;
  avgSyncTimeMs: number;
}

interface SyncHealthProps {
  syncStats: SyncStats;
}

export const SyncHealth: React.FC<SyncHealthProps> = ({ syncStats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Sync Queue Visual Summary */}
      <div className="bg-white dark:bg-[#0B1124] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-white">Active Queue Monitoring</h3>
          <p className="text-[9px] text-slate-400">Monitoring outbound transactions and local queue delays</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-slate-400">Sync Engine State</span>
            <span className="text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Connected & Listening
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-slate-400">Average Database Round-Trip</span>
            <span className="font-mono text-slate-700 dark:text-white font-bold">{syncStats.avgSyncTimeMs} ms</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-slate-400">Retrials Pending</span>
            <span className="font-mono text-slate-700 dark:text-white font-bold">{syncStats.retryCount}</span>
          </div>
        </div>
      </div>

      {/* Synchronization Diagram */}
      <div className="bg-slate-50 dark:bg-[#090D1F] p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800 flex flex-col justify-between">
        <div>
          <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Local Queue Topology Pipeline</h4>
          <div className="flex items-center justify-around mt-4 bg-white dark:bg-[#0E152B] p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <p className="text-[8px] uppercase text-slate-400 font-bold">IndexedDB</p>
              <p className="text-[10px] font-mono text-slate-800 dark:text-white font-bold mt-0.5">Dexie Local</p>
            </div>
            <span className="text-slate-300 font-bold">➔</span>
            <div className="text-center">
              <p className="text-[8px] uppercase text-slate-400 font-bold">Transit Queue</p>
              <p className="text-[10px] font-mono text-indigo-500 font-bold mt-0.5">{syncStats.pendingCount} in Queue</p>
            </div>
            <span className="text-slate-300 font-bold">➔</span>
            <div className="text-center">
              <p className="text-[8px] uppercase text-slate-400 font-bold">Cloud</p>
              <p className="text-[10px] font-mono text-slate-800 dark:text-white font-bold mt-0.5">Firestore</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

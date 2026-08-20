import React from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SidebarSyncWidgetProps {
  isCollapsed?: boolean;
}

export const SidebarSyncWidget: React.FC<SidebarSyncWidgetProps> = ({ isCollapsed }) => {
  const { pendingCount, syncState, forceSync } = useOfflineSync();
  const quotaExceeded = typeof window !== 'undefined' && (window as any).__FIRESTORE_QUOTA_EXCEEDED;

  if (isCollapsed) {
    return (
      <button 
        onClick={() => forceSync()}
        title={`Sync: ${syncState} (${pendingCount} pending)`}
        className={`p-3 rounded-2xl transition-all shadow-soft active:scale-95 cursor-pointer border ${
          syncState === 'OFFLINE' 
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600' 
            : syncState === 'SYNCING'
            ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-600'
            : pendingCount > 0
            ? 'bg-slate-900 dark:bg-white border-slate-800 dark:border-slate-200 text-white dark:text-slate-900'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600'
        }`}
      >
        {syncState === 'OFFLINE' ? <CloudOff className="w-5 h-5" /> :
         syncState === 'SYNCING' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
         pendingCount > 0 ? <Cloud className="w-5 h-5 animate-pulse" /> :
         <CheckCircle2 className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <div className="mt-4 border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-3xl p-4 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {quotaExceeded ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          ) : syncState === 'OFFLINE' ? (
            <CloudOff className="w-3.5 h-3.5 text-amber-500" />
          ) : syncState === 'SYNCING' ? (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span className="text-[10px] font-bold uppercase text-slate-900 dark:text-white tracking-wide">
            {syncState === 'OFFLINE' ? 'Perangkat Offline' : 
             syncState === 'SYNCING' ? 'Sinkronisasi...' : 
             quotaExceeded ? 'Kuota Terlampaui' : 'Sinkron Cloud'}
          </span>
        </div>
        {pendingCount > 0 && (
          <span className="px-2 py-0.5 rounded-lg bg-indigo-500 text-white text-[9px] font-bold font-mono">
            {pendingCount}
          </span>
        )}
      </div>
      
      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
        {syncState === 'OFFLINE' 
          ? 'Data Anda tersimpan aman di database lokal Dexie (Offline First).' 
          : syncState === 'SYNCING'
          ? 'Sedang mengirimkan perubahan delta terbaru ke Firestore.'
          : pendingCount > 0
          ? 'Ada data baru yang menunggu sinkronisasi otomatis.'
          : 'Semua data telah sinkron dengan Cloud Firestore (Source of Truth).'}
      </p>

      {pendingCount > 0 && syncState !== 'OFFLINE' && (
        <button
          onClick={() => forceSync()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wide py-2.5 px-4 rounded-2xl transition-all shadow-soft active:scale-[0.98] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Paksa Sinkron</span>
        </button>
      )}
      
      <div className="mt-2 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tight">
        <span>Arsitektur Layer</span>
        <span className="text-indigo-500">Dexie & Firestore</span>
      </div>
    </div>
  );
};

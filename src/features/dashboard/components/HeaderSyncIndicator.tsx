/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * COMPONENT: HeaderSyncIndicator (Real-time sync progress monitor in header)
 */

import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { localDb } from '@/database/dexie';
import { motion, AnimatePresence } from 'motion/react';

export const HeaderSyncIndicator: React.FC = () => {
  const { pendingCount, isSyncing, isOnline, syncState, forceSync } = useOfflineSync();
  const [exactQueueLen, setExactQueueLen] = useState<number>(pendingCount);

  useEffect(() => {
    setExactQueueLen(pendingCount);
  }, [pendingCount]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await localDb.sync_queue
          .where('status')
          .anyOf(['pending', 'waiting', 'failed'])
          .count();
        setExactQueueLen(count);
      } catch (err) {
        // ignore
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const quotaExceeded = typeof window !== 'undefined' && (window as any).__FIRESTORE_QUOTA_EXCEEDED;

  if (quotaExceeded) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 rounded-3xl text-rose-600 dark:text-rose-400 text-xs font-medium shadow-soft"
      >
        <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
        <div className="flex flex-col">
          <span className="font-bold uppercase tracking-wide text-[9px]">Quota Reached</span>
          <span className="text-[9px] text-rose-500/80 font-mono">{exactQueueLen} Local Dexie</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {syncState === 'OFFLINE' ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            title="Perangkat Offline. Data tersimpan aman di Dexie."
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 rounded-3xl text-amber-700 dark:text-amber-300 text-xs shadow-soft cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-amber-400 opacity-75" />
              <CloudOff className="w-4 h-4 text-amber-500 relative z-10" />
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[9px] text-amber-800 dark:text-amber-200">
                  Offline
                </span>
                <span className="font-mono text-[9px] bg-amber-200/50 dark:bg-amber-900/50 px-1.5 rounded-lg font-bold">
                  {exactQueueLen}
                </span>
              </div>
              <span className="text-[8px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-tight">Dexie Mode</span>
            </div>
          </motion.div>
        ) : syncState === 'SYNCING' ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            title="Sinkronisasi delta perubahan ke Firestore..."
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl text-indigo-700 dark:text-indigo-300 text-xs shadow-soft"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[9px]">
                  Syncing
                </span>
                <span className="font-mono text-[9px] bg-indigo-200/50 dark:bg-indigo-900/50 px-1.5 rounded-lg font-bold">
                  {exactQueueLen}
                </span>
              </div>
              <div className="w-16 bg-indigo-200 dark:bg-indigo-900 h-1 rounded-full overflow-hidden mt-1">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="bg-indigo-600 dark:bg-indigo-400 h-full w-1/2" 
                />
              </div>
            </div>
          </motion.div>
        ) : exactQueueLen > 0 ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => forceSync()}
            title="Klik untuk memaksa sinkronisasi antrean ke cloud"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white border border-slate-800 dark:border-slate-200 rounded-3xl text-white dark:text-slate-900 text-xs shadow-float cursor-pointer active:scale-95 transition-all"
          >
            <Cloud className="w-4 h-4 text-white dark:text-slate-900 animate-pulse" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[9px]">
                  Wait Sync
                </span>
                <span className="font-mono text-[9px] bg-white/20 dark:bg-slate-200 px-1.5 rounded-lg font-bold">
                  {exactQueueLen}
                </span>
              </div>
              <span className="text-[8px] opacity-70 font-medium uppercase">Queue Dexie</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="synced"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            title="Semua data tersinkronisasi sempurna dengan Cloud Firestore (Source of Truth)"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 rounded-3xl text-emerald-700 dark:text-emerald-300 text-xs shadow-soft"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <div className="flex flex-col">
              <span className="font-bold uppercase tracking-wider text-[9px]">
                Cloud OK
              </span>
              <span className="text-[8px] text-emerald-600/70 dark:text-emerald-400/70 font-medium uppercase">Source of Truth</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

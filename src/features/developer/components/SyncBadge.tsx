/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * COMPONENT: SyncBadge (Real-time Offline Queue Badge)
 */

import React, { useState, useEffect } from 'react';
import { UserRole } from '@/types/roles';
import { useUserStore } from '@/stores/userStore';
import { CloudOff, RefreshCw, Database, Clock } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { localDb } from '@/database/dexie'; // eslint-disable-line no-restricted-imports
import { useSyncStore } from '@/stores/syncStore';

interface SyncBadgeProps {
  progress?: number;
  isSyncing?: boolean;
  message?: string;
}

const CircularProgress: React.FC<{ value: number; size?: number; strokeWidth?: number }> = ({ 
  value, 
  size = 18, 
  strokeWidth = 2 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-indigo-400 transition-all duration-300 ease-out"
        />
      </svg>
      <span className="absolute text-[8px] font-bold text-white leading-none">
        {Math.round(value)}
      </span>
    </div>
  );
};

export const SyncBadge: React.FC<SyncBadgeProps> = ({
  progress: propProgress,
  isSyncing: propIsSyncing,
  message: propMessage
}) => {
  const { pendingCount, isOnline, syncState, forceSync } = useOfflineSync();
  const storeSync = useSyncStore();
  
  const isSyncing = propIsSyncing ?? storeSync.isSyncing;
  const progress = propProgress ?? storeSync.progress;
  const message = propMessage ?? storeSync.message;

  const roles = useUserStore((state) => state.roles) || [];
  const isDeveloper = roles.includes(UserRole.DEVELOPER);
  const [queueCount, setQueueCount] = useState<number>(pendingCount);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    setQueueCount(pendingCount);
  }, [pendingCount]);

  useEffect(() => {
    // Poll sync queue count and quota status every 3 seconds for real-time reactivity
    const interval = setInterval(async () => {
      try {
        if ((window as any).__FIRESTORE_QUOTA_EXCEEDED) {
          setQuotaExceeded(true);
        }
        const count = await localDb.sync_queue
          .where('status')
          .anyOf(['pending', 'failed'])
          .count();
        setQueueCount(count);
      } catch (err) {
        // ignore
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Only display badge for developers and when offline or when there are pending queue items or syncing
  if (!isDeveloper || (syncState === 'SYNCED' && !isSyncing)) {
    return null;
  }

  // Handle Quota Exceeded specifically for developers if we still want to show it, 
  // but the user asked to remove or move the floating icon.
  // We'll remove the specific red quota badge as requested.

  return (
    <div
      id="sync-badge-container"
      className={`sync-badge-component fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-fade-in font-sans text-xs font-semibold bg-slate-900/95 text-white border-slate-700/80 shadow-slate-950/50 ${
        syncState === 'SYNCING' ? 'animate-pulse ring-2 ring-indigo-500/50' : ''
      }`}
    >
      {syncState === 'OFFLINE' ? (
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <CloudOff className="w-4 h-4 text-amber-400 relative z-10" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider uppercase text-amber-300 font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20">
                OFFLINE
              </span>
              <span className="text-white text-xs font-mono font-medium">
                <strong className="text-amber-300">{queueCount}</strong> pending item
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Data disimpan aman di Dexie lokal</span>
          </div>
        </div>
      ) : syncState === 'SYNCING' || isSyncing ? (
        <div className="flex items-center gap-3">
          {isSyncing ? (
            <CircularProgress value={progress} />
          ) : (
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          )}
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider uppercase text-indigo-300 font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/20">
                {isSyncing ? 'MASTER SYNC' : 'SYNCING'}
              </span>
              <span className="text-white text-xs font-mono">
                {isSyncing ? (
                  <>
                    Progress <strong className="text-indigo-300">{progress}%</strong>
                  </>
                ) : (
                  <>
                    Sinkronisasi delta <strong className="text-indigo-300">{queueCount}</strong> perubahan
                  </>
                )}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal truncate max-w-[200px]">
              {isSyncing ? message : 'Mengirim antrean ke Cloud Firestore'}
            </span>
          </div>
        </div>
      ) : syncState === 'WAITING' ? (
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider uppercase text-amber-300 font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20">
                WAITING
              </span>
              <span className="text-white text-xs font-mono">
                <strong className="text-amber-300">{queueCount}</strong> perubahan siap sync
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Menunggu jadwal sinkronisasi otomatis</span>
          </div>
          <button
            onClick={() => forceSync()}
            className="ml-2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Sync
          </button>
        </div>
      ) : null}
    </div>
  );
};


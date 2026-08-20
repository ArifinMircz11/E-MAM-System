/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: HOOK LAYER (OFFLINE SYNC COORDINATOR)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { localDb } from '@/database/dexie';
import { triggerOfflineProcessing } from '@/services/offlineAutoProcessService';

export type SyncStateMode = 'SYNCING' | 'WAITING' | 'OFFLINE' | 'SYNCED';

export const useOfflineSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isSyncingRef = useRef(false);
  isSyncingRef.current = isSyncing;

  const checkPending = useCallback(async () => {
    try {
      const count = await localDb.sync_queue
        .where('status')
        .anyOf(['pending', 'waiting', 'failed'])
        .count();
      setPendingCount(count);
    } catch (err) {
      console.warn('Failed to check pending sync:', err);
    }
  }, []);

  const forceSync = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) {
      if (!navigator.onLine) {
        toast.error('Perangkat sedang offline. Sambungkan internet untuk menyinkronkan.');
      }
      return;
    }

    setIsSyncing(true);
    try {
      await triggerOfflineProcessing();
      await checkPending();
      toast.success('Sinkronisasi antrean berhasil diproses.');
    } catch (err) {
      console.error('Manual sync failed:', err);
      toast.error('Sinkronisasi gagal. Dicoba kembali nanti.');
    } finally {
      setIsSyncing(false);
    }
  }, [checkPending]);

  useEffect(() => {
    checkPending();

    const handleOnline = () => {
      setIsOnline(true);
      forceSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(async () => {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      await checkPending();
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkPending, forceSync]);

  const syncState: SyncStateMode = !isOnline
    ? 'OFFLINE'
    : isSyncing
    ? 'SYNCING'
    : pendingCount > 0
    ? 'WAITING'
    : 'SYNCED';

  return {
    isSyncing,
    pendingCount,
    isOnline,
    syncState,
    forceSync,
    checkPending,
  };
};


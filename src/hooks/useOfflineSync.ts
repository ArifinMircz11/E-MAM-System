/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: HOOK LAYER (OFFLINE SYNC COORDINATOR)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { localDb } from '@/database/dexie';
import { triggerOfflineProcessing } from '@/services/offlineAutoProcessService';
import { useSyncStore } from '@/stores/syncStore';

export type SyncStateMode = 'SYNCING' | 'WAITING' | 'OFFLINE' | 'SYNCED';

export const useOfflineSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const isSyncingRef = useRef(false);
  isSyncingRef.current = isSyncing;

  const setStoreIsSyncing = useSyncStore((state) => state.setIsSyncing);
  const setStorePendingCount = useSyncStore((state) => state.setPendingWritesCount);
  const setStoreLastSync = useSyncStore((state) => state.setLastSync);
  const setStoreProgress = useSyncStore((state) => state.setProgress);
  const setStoreMessage = useSyncStore((state) => state.setMessage);
  const setStoreOnline = useSyncStore((state) => state.setIsOnline);

  const checkPending = useCallback(async () => {
    try {
      const count = await localDb.sync_queue
        .where('status')
        .anyOf(['pending', 'waiting', 'failed'])
        .count();

      setPendingCount(count);
      setStorePendingCount(count);
      return count;
    } catch (err) {
      console.warn('Failed to check pending sync:', err);
      return pendingCount;
    }
  }, [pendingCount, setStorePendingCount]);

  const forceSync = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) {
      if (!navigator.onLine) {
        setIsOnline(false);
        setStoreOnline(false);
        setStoreMessage('Perangkat offline — perubahan tetap tersimpan di Dexie.');
        toast.error('Perangkat sedang offline. Sambungkan internet untuk menyinkronkan.');
      }
      return;
    }

    setIsSyncing(true);
    setStoreIsSyncing(true);
    setStoreOnline(true);
    setStoreProgress(10);
    setStoreMessage('Memproses antrean sinkronisasi...');

    try {
      await triggerOfflineProcessing();
      setStoreProgress(80);
      const remaining = await checkPending();

      if (remaining === 0) {
        setStoreProgress(100);
        setStoreLastSync(Date.now());
        setStoreMessage('Sinkronisasi selesai.');
      } else {
        setStoreProgress(80);
        setStoreMessage(`${remaining} perubahan menunggu sinkronisasi.`);
      }

      toast.success('Sinkronisasi antrean berhasil diproses.');
    } catch (err) {
      console.error('Manual sync failed:', err);
      setStoreMessage('Sinkronisasi gagal — akan dicoba kembali.');
      toast.error('Sinkronisasi gagal. Dicoba kembali nanti.');
    } finally {
      setIsSyncing(false);
      setStoreIsSyncing(false);
    }
  }, [
    checkPending,
    setStoreIsSyncing,
    setStoreLastSync,
    setStoreMessage,
    setStoreOnline,
    setStoreProgress,
  ]);

  useEffect(() => {
    void checkPending();
    setStoreOnline(isOnline);

    const handleOnline = () => {
      setIsOnline(true);
      setStoreOnline(true);
      void forceSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStoreOnline(false);
      setStoreMessage('Perangkat offline — perubahan tetap tersimpan di Dexie.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(async () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnline(online);
      setStoreOnline(online);
      await checkPending();
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkPending, forceSync, isOnline, setStoreMessage, setStoreOnline]);

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

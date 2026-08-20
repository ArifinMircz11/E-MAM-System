// src/hooks/useSafeFirestoreListener.ts
// ✅ SAFE HOOK — Mustahil bocor, otomatis cleanup

import { useEffect, useRef } from 'react';
import { realtimeHub } from '@/services/realtime/realtimeHub';
import type { ListenerKey } from '@/services/realtime/realtimeHub';

interface UseSafeFirestoreListenerOptions {
  /** Unique key untuk mencegah duplikasi */
  key: ListenerKey;
  /** Fungsi yang return fungsi unsubscribe */
  subscribe: () => (() => void) | Promise<() => void>;
  /** Conditional: jika false, listener tidak dibuat */
  enabled?: boolean;
  /** Tenant ID untuk grouping & bulk cleanup */
  tenantId?: string;
  /** Callback saat error */
  onError?: (error: Error) => void;
}

/**
 * Hook aman untuk Firestore listener.
 *
 * JAMINAN:
 * - Tidak akan pernah ada duplikasi (cek key di realtimeHub)
 * - Otomatis cleanup saat unmount
 * - Otomatis cleanup saat key berubah
 * - Support async subscribe
 */
export function useSafeFirestoreListener({
  key,
  subscribe,
  enabled = true,
  tenantId,
  onError,
}: UseSafeFirestoreListenerOptions): void {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Jangan buat listener jika disabled
    if (!enabled) {
      // Pastikan listener lama dibersihkan
      if (cleanupRef.current) {
        realtimeHub.unsubscribe(key);
        cleanupRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const setup = async () => {
      try {
        const unsubscribe = await subscribe();

        // Cegah setup setelah unmount
        if (!isMounted) {
          unsubscribe();
          return;
        }

        // Simpan cleanup lokal
        cleanupRef.current = unsubscribe;

        // Daftarkan ke hub (otomatis bunuh yang lama jika key sama)
        realtimeHub.subscribe(key, unsubscribe, { tenantId });
      } catch (error) {
        if (isMounted && onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
        console.error(`[useSafeFirestoreListener] Error setting up "${key}":`, error);
      }
    };

    setup();

    // Cleanup saat unmount ATAU key berubah
    return () => {
      isMounted = false;
      realtimeHub.unsubscribe(key);
      cleanupRef.current = null;
    };
  }, [key, enabled, tenantId]); // subscribe sengaja TIDAK di dependency (referensi fungsi berubah tiap render)
}

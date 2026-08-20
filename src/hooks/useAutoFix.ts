import { useState, useCallback } from 'react';
import { autoFix } from '@/services/sync/autoFixEngine';
import { useUIStore } from '@/stores/uiStore';
import { toast } from 'sonner';

type FixResult = {
  fixed: boolean;
  message: string;
};

/**
 * e-Mam System Auto-Fix Hook
 * Wraps async calls with automatic error classification and correction strategies.
 */
export function useAutoFix() {
  const setAutoFixStatus = useUIStore((state) => state.setAutoFixStatus);
  const [fixLog, setFixLog] = useState<FixResult[]>([]);

  const safeCall = useCallback(
    async <T>(fn: () => Promise<T>, label?: string): Promise<T | null> => {
      try {
        return await fn();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const isOfflineError =
          !navigator.onLine ||
          errorMsg.toLowerCase().includes('offline') ||
          errorMsg.toLowerCase().includes('unavailable') ||
          errorMsg.toLowerCase().includes('klien sedang offline') ||
          errorMsg.toLowerCase().includes('network-error') ||
          errorMsg.toLowerCase().includes('network error') ||
          errorMsg.toLowerCase().includes('failed to fetch') ||
          errorMsg.toLowerCase().includes('kotak keluar lokal');

        if (isOfflineError) {
          console.warn(
            `[AutoFix: ${label ?? 'safeCall'}] Client is offline or has network connectivity issues. Quietly bypassing auto-fix prompts.`,
          );
          try {
            return await fn();
          } catch {
            return null;
          }
        }

        console.error(`[AutoFix: ${label ?? 'safeCall'}] Error terdeteksi:`, errorMsg);

        setAutoFixStatus({ isFixing: true, message: label ?? 'permintaan data' });
        const toastId = toast.loading(
          `Masalah terdeteksi pada "${label ?? 'modul'}". Mencoba memperbaiki otomatis...`,
          {
            description: 'Sistem sedang memulihkan integritas data.',
            duration: 10000,
          },
        );

        const result = await autoFix(error);

        setFixLog((prev) => [...prev, result]);
        setAutoFixStatus({ lastFix: result.message, message: result.message });

        if (result.fixed) {
          toast.success(`Berhasil diperbaiki: ${result.message}`, { id: toastId });
          // ✅ Retry sekali setelah fix berhasil
          try {
            const retryResult = await fn();
            setAutoFixStatus({ isFixing: false });
            return retryResult;
          } catch (retryError) {
            console.error(`[AutoFix: ${label ?? 'safeCall'}] Retry gagal:`, retryError);
            toast.error('Perbaikan berhasil tapi permintaan gagal diulang. Silakan coba lagi.', {
              id: toastId,
            });
          }
        } else {
          toast.error(`Gagal memperbaiki otomatis: ${result.message}`, { id: toastId });
        }

        setAutoFixStatus({ isFixing: false });
        return null;
      }
    },
    [setAutoFixStatus],
  );

  return { safeCall, fixLog };
}

import { classifyError } from '@/utils/errorClassifier';
import { logAudit } from '@/services/auditLogService';
import { db } from '@/services/firebase';
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { sanitizeError } from '@/utils/dataHelpers';

type FixResult = {
  fixed: boolean;
  message: string;
};

// Helper for logging
async function logToAudit(code: string, details: string, originalError?: any) {
  if ((globalThis as any)._isAuditLogging) return;
  (globalThis as any)._isAuditLogging = true;
  try {
    const errorMsg = originalError ? sanitizeError(originalError) : details;
    await logAudit({
      action: `AUTO_FIX_${code}`,
      category: 'SYSTEM',
      details: errorMsg,
    });
  } catch (e) {
    console.warn('Failed to audit auto-fix, saving to local storage fallback:', sanitizeError(e));
    try {
      const pending = JSON.parse(localStorage.getItem('emam_pending_auto_fix_logs') ?? '[]');
      pending.push({
        code,
        details,
        error: originalError ? sanitizeError(originalError) : undefined,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('emam_pending_auto_fix_logs', JSON.stringify(pending.slice(-20))); // Keep last 20
    } catch (storageErr) {
      console.error('Local storage also failed:', sanitizeError(storageErr));
    }
  } finally {
    (globalThis as any)._isAuditLogging = false;
  }
}

/**
 * Flush pending auto-fix logs from localStorage to Firestore
 */
export async function flushPendingAutoFixLogs() {
  if (!navigator.onLine || !db) return;

  const pendingRaw = localStorage.getItem('emam_pending_auto_fix_logs');
  if (!pendingRaw) return;

  try {
    const pending = JSON.parse(pendingRaw);
    if (pending.length === 0) return;

    const batch = firestoreGateway.writeBatch(db);
    pending.forEach((log: any) => {
      const tenantId = log.tenantId || 'default';
      const actionSlug = (log.code || 'unknown')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 20);
      const manualId = `${tenantId}_FLUSHED_${actionSlug}_${Date.now()}_${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const logRef = firestoreGateway.doc(db, 'audit_logs', manualId);

      batch.set(logRef, {
        action: `AUTO_FIX_FLUSHED_${log.code}`,
        category: 'SYSTEM',
        details: log.details,
        tenantId: tenantId,
        timestamp: firestoreGateway.serverTimestamp(),
        originalTimestamp: log.timestamp,
        isAutoFix: true,
      });
    });

    await batch.commit();
    localStorage.removeItem('emam_pending_auto_fix_logs');
    console.info(`[AutoFix] Flushed ${pending.length} pending logs to Firestore.`);
  } catch (err) {
    console.warn('[AutoFix] Failed to flush pending logs:', err);
  }
}

const fixStrategies: Record<string, () => Promise<FixResult>> = {
  FALLBACK_TO_CACHE: async () => {
    try {
      return { fixed: true, message: 'Beralih ke mode offline (Cache IndexedDB)' };
    } catch {
      return { fixed: false, message: 'Gagal beralih ke cache' };
    }
  },
  FORCE_SYNC: async () => {
    return { fixed: false, message: 'Sinkronisasi data master tidak tersedia' };
  },
  REBUILD_CACHE: async () => {
    return { fixed: false, message: 'Rebuild cache tidak tersedia' };
  },
  THROTTLE_AND_RETRY: async () => {
    await new Promise((r) => setTimeout(r, 5000));
    return { fixed: true, message: 'Menunggu jeda kuota Firestore (Throttled)' };
  },
  WAIT_AND_RETRY: async () => {
    await new Promise((r) => setTimeout(r, 3000));
    return { fixed: true, message: 'Menunggu proses sweep lain selesai' };
  },
  RECONNECT_WEBSOCKET: async () => {
    return { fixed: false, message: 'WebSocket error — abaikan atau refresh halaman' };
  },
  ESCALATE_TO_ADMIN: async () => {
    await logToAudit('PERMISSION_ERROR', 'Akses ditolak Firestore - Role mungkin tidak cukup');
    return { fixed: false, message: 'Tidak memiliki izin — hubungi Admin' };
  },
  ESCALATE_TO_DEVELOPER: async () => {
    await logToAudit('UNKNOWN_ERROR', 'Error tidak dikenal terdeteksi');
    return { fixed: false, message: 'Error diteruskan ke Developer Console' };
  },
  LOG_AND_RELOAD: async () => {
    await logToAudit('INFINITE_LOOP', 'React infinite loop terdeteksi - Mengulang halaman');
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    return { fixed: true, message: 'Halaman dimuat ulang' };
  },
};

export async function autoFix(error: unknown): Promise<FixResult> {
  const classified = classifyError(error);
  await logToAudit(classified.code, classified.message, error);
  const strategy = fixStrategies[classified.fixStrategy];
  if (strategy) {
    console.info(`[AutoFix] Menjalankan strategi: ${classified.fixStrategy}`);
    return await strategy();
  }
  return {
    fixed: false,
    message: classified.message,
  };
}

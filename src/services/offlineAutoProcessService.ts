import { localDb } from '@/database/dexie';
import { syncRepository } from '@/repositories/SyncRepository';
import { authGateway } from '@/services/auth/AuthGateway';
import { SyncEngine } from '@/services/SyncEngine';

/**
 * Compatibility wrapper for the Sync Engine architecture.
 */
export class OfflineAutoProcessService {
  /**
   * Batch process today's local attendance data and enqueue for sync.
   */
  static async processToday() {
    const today = new Date().toISOString().split('T')[0];
    if (!authGateway.getCurrentUser()) throw new Error('User tidak login');

    // Ambil data pending dari IndexedDB
    const pendingAttendance = await localDb.attendance
      .where('tanggal')
      .equals(today)
      .filter((att) => att.status === 'Hadir' && (!att.point || att.point.totalPoinHariIni === 0))
      .toArray();

    let count = 0;
    for (const att of pendingAttendance) {
      if (att.id) {
        const updatedPoint = { pelanggaran: 0, prestasi: 10, totalPoinHariIni: 10 };
        // Update local Dexie
        await localDb.attendance.update(att.id, { status: 'Hadir', point: updatedPoint });

        // Enqueue for sync
        await syncRepository.enqueue({
          action: 'UPDATE',
          collection: 'attendance',
          payload: { id: att.id, status: 'Hadir', point: updatedPoint },
          tenantId: att.tenantId || 'default'
        });
        count++;
      }
    }

    return {
      attendanceProcessed: count,
      totalOps: count,
    };
  }

  /**
   * Sync pending queue items to Firestore.
   */
  static async syncToFirestore() {
    if (!navigator.onLine) return { status: 'offline' };
    await SyncEngine.processQueue();
    return { status: 'success' };
  }
}

/**
 * Trigger background processing.
 */
export async function triggerOfflineProcessing() {
  if (!navigator.onLine) return;
  await SyncEngine.processQueue();
}


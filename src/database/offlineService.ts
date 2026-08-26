/**
 * @license
 * e-Mam System - Offline Service
 * LAYER: SERVICE (Offline Persistence & Sync Trigger)
 */

import { localDb } from './dexie';
import { syncRepository } from '@/repositories/SyncRepository';

export const OfflineService = {
  async clearAllCaches() {
    await Promise.all([
      localDb.students.clear(),
      localDb.teachers.clear(),
      localDb.classes.clear(),
      localDb.pointCategories.clear(),
      localDb.attendance.clear(),
      localDb.cache.clear(),
      localDb.systemSettings.clear(),
      localDb.sync_queue.clear(),
      localDb.dead_letter_queue.clear(),
    ]);
  },

  async checkIntegrity() {
    try {
      const counts = await Promise.all([
        localDb.students.count(),
        localDb.classes.count(),
        localDb.teachers.count(),
      ]);
      return { students: counts[0], classes: counts[1], teachers: counts[2] };
    } catch (e) {
      console.error('[OfflineService] Integrity check failed:', e);
      throw e;
    }
  },

  async addToSyncQueue(
    collection: string,
    type: 'create' | 'update' | 'delete',
    payload: any,
    docId?: string,
  ) {
    const resolvedDocId = docId || payload?.id || payload?.uid || payload?.studentsId || payload?.teachersId || payload?.classId;
    return syncRepository.enqueue({
      tenantId: payload?.tenantId,
      collection,
      operation: type,
      recordId: resolvedDocId,
      payload,
      version: payload?.version,
    });
  },
};

export const localDbOperations = {
  async clearAllData() {
    console.log('[Dexie] Performing FULL DATABASE RESET...');
    const tables = localDb.tables;
    await Promise.all(tables.map((table) => table.clear()));
    console.log('[Dexie] All tables cleared successfully.');
  },
};

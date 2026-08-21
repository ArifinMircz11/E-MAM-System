/**
 * @license
 * e-Mam System - Sync Engine Core
 * LAYER: SERVICE (Architecture Compliant - Only Firestore Gateway)
 */

import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { db } from './firebase';
import { SyncStatus } from '@/database/dexie';
import { syncRepository } from '@/repositories/SyncRepository';
import type { SyncQueueItem } from '@/types';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { AuditLogger } from '@/core/audit/AuditLogger';

export class SyncEngine {
  private static isProcessing = false;

  static async processQueue() {
    if (this.isProcessing || !navigator.onLine) return;
    if (!SecurityContextService.isReady()) return;

    const activeSecCtx = SecurityContextService.getNullableContext();
    if (!activeSecCtx?.tenantId) return;

    this.isProcessing = true;
    try {
      const items = await syncRepository.getPendingItems(activeSecCtx);
      for (const item of items) {
        try {
          await this.processItem(item, activeSecCtx);
        } catch (err) {
          console.error(`[SyncEngine] Failed to process queue item ${item.id}:`, err);
        }
      }
      await syncRepository.clearCompleted();
    } finally {
      this.isProcessing = false;
    }
  }

  private static async processItem(item: SyncQueueItem, activeSecCtx: any) {
    if (!activeSecCtx) {
      throw new ArchitectureBoundaryError(
        'sync_engine',
        'SYNC_SECURITY_CONTEXT_MISSING',
        'SecurityContext tidak ditemukan saat memproses item sinkronisasi.',
      );
    }

    ArchitectureBoundaryEnforcer.enforceSyncEngineTenant(
      item.tenantId,
      activeSecCtx.tenantId,
      activeSecCtx.isDeveloper,
    );

    await syncRepository.updateStatus(item.id, 'processing');

    try {
      const operation = item.operation.toLowerCase();
      const customAction = item.metadata?.action;
      const colName = item.collection;
      const payload = item.payload as Record<string, any>;
      const tenantId = item.tenantId;

      const docId = item.recordId ??
        payload?.id ?? payload?.docId ?? payload?.documentId ?? payload?.idUnik ??
        payload?.uid ?? payload?.userUid ?? payload?.studentId ?? payload?.studentsId ??
        payload?.teacherId ?? payload?.teachersId ?? payload?.userId ?? payload?.classId ??
        payload?.classesId ?? payload?.scheduleId ?? payload?.journalId ?? payload?.letterId ??
        payload?.pointId;

      if (!docId) {
        await syncRepository.moveToDeadLetterQueue(
          item.id,
          'Document ID missing in payload',
          'SYNC_QUEUE_ENTITY_ID_MISSING',
        );
        return;
      }

      const docRef = dbGateway.doc(db, colName, String(docId));
      const customActions = ['SCAN_PRESENSI', 'ADD_POINT', 'ATTENDANCE_PROCESS', 'BATCH_SYNC'];

      if (customAction && customActions.includes(customAction)) {
        const { SyncDispatcher } = await import('@/sync/SyncDispatcher');
        await SyncDispatcher.dispatch(item as any, activeSecCtx);
      } else if (operation === 'create' || operation === 'update' || operation === 'patch' || operation === 'bulk_create' || operation === 'bulk_update') {
        let overwriteRemote = true;
        try {
          const docSnap = await dbGateway.getDoc(docRef);
          if (docSnap.exists()) {
            const remoteData = docSnap.data();
            const remoteVersion = remoteData.version || 0;
            const remoteUpdatedAt = remoteData.updatedAt instanceof dbGateway.Timestamp
              ? remoteData.updatedAt.toMillis()
              : (remoteData.updatedAt || 0);
            const localVersion = payload?.version || item.metadata?.version || 0;
            const localUpdatedAt = payload?.updatedAt || 0;
            if (remoteVersion > localVersion || (remoteVersion === localVersion && remoteUpdatedAt > localUpdatedAt)) {
              overwriteRemote = false;
              await AuditLogger.log(
                activeSecCtx.uid || 'system',
                'SYNC_PUSH_CONFLICT_RESOLVED',
                'SyncEngine',
                'warning',
                { collection: colName, docId, tenantId, resolution: 'KEEP_REMOTE', localVersion, remoteVersion, localUpdatedAt, remoteUpdatedAt },
              );
            }
          }
        } catch (fetchErr) {
          console.warn('[SyncEngine] Pre-write read failed:', fetchErr);
        }

        if (overwriteRemote) {
          const firestoreData = {
            ...payload,
            tenantId,
            updatedAt: dbGateway.serverTimestamp(),
            syncStatus: SyncStatus.SYNCED,
          };
          delete (firestoreData as any).isOffline;
          await dbGateway.writeBatch(db).set(docRef, firestoreData, { merge: true }).commit();
          await AuditLogger.log(activeSecCtx.uid || 'system', `SYNC_${operation.toUpperCase()}`, 'SyncEngine', 'success', { collection: colName, docId, tenantId });
        }
      } else if (operation === 'delete') {
        await dbGateway.writeBatch(db).delete(docRef).commit();
        await AuditLogger.log(activeSecCtx.uid || 'system', 'SYNC_DELETE', 'SyncEngine', 'success', { collection: colName, docId, tenantId });
      } else {
        throw new Error(`Unsupported sync operation: ${item.operation}`);
      }

      await syncRepository.updateStatus(item.id, 'completed');
      await syncRepository.markRecordSynced(colName, String(docId));
    } catch (error: any) {
      const attempts = (item.attempts || 0) + 1;
      await AuditLogger.log(
        activeSecCtx.uid || 'system',
        `SYNC_${item.operation.toUpperCase()}_ERROR`,
        'SyncEngine',
        'error',
        { collection: item.collection, docId: item.recordId, tenantId: item.tenantId, error: error.message, attempts },
      );

      if (attempts >= 5) {
        await syncRepository.moveToDeadLetterQueue(
          item.id,
          error.message || 'Exceeded retry limit',
          error.code || 'SYNC_MAX_RETRIES_EXCEEDED',
        );
      } else {
        await syncRepository.incrementRetry(item.id);
        await syncRepository.updateStatus(item.id, 'pending', error.message);
      }
      throw error;
    }
  }

  static async syncAll() { await this.processQueue(); }
  static async executeAutoSweepSync(_context: any, _tenantId: string) { await this.processQueue(); }

  static async executeClearPointsSync(_context: any, tenantId: string) {
    if (!tenantId) return;
    const q = dbGateway.query(dbGateway.collection(db, 'poin'), dbGateway.where('tenantId', '==', tenantId));
    const poinSnap = await dbGateway.getDocs(q);
    const batch = dbGateway.writeBatch(db);
    poinSnap.docs.forEach((d: any) => batch.delete(d.ref));
    await batch.commit();
  }

  static async executeBatchDeleteSync(context: any, collName: string, filter: any) {
    const tenantId = context?.tenantId;
    if (!tenantId) return;
    let q = dbGateway.query(dbGateway.collection(db, collName), dbGateway.where('tenantId', '==', tenantId));
    if (filter?.date) q = dbGateway.query(q, dbGateway.where('date', '==', filter.date));
    if (filter?.month) q = dbGateway.query(q, dbGateway.where('date', '>=', `${filter.month}-01`), dbGateway.where('date', '<=', `${filter.month}-31`));
    const snap = await dbGateway.getDocs(q);
    const batch = dbGateway.writeBatch(db);
    snap.docs.forEach((d: any) => batch.delete(d.ref));
    await batch.commit();
  }
}

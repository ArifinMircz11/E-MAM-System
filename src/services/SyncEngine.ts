import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { SyncStatus } from '@/domain/entities/base';
import { syncRepository } from '@/repositories/SyncRepository';
import { localSyncRepository } from '@/repositories/LocalSyncRepository';
import { FirestoreSyncDataSource, getNextDeltaCursor } from '@/infrastructure/datasource/SyncDataSource';
import type { SyncQueueItem } from '@/types';
import type { SecurityContext } from '@/core/security/types';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { auditLogger } from '@/core/audit/AuditLogger';

const MAX_SYNC_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 1_000;

export const shouldApplyMutationVersion = (remoteVersion: number, mutationVersion: number): boolean => Number(mutationVersion) > Number(remoteVersion);

export class SyncEngine {
  private static isProcessing = false;
  private static isStopped = false;
  private static intervalHandle: ReturnType<typeof setInterval> | null = null;
  static start(intervalMs = 10_000): void { this.isStopped = false; if (this.intervalHandle) return; void this.processQueue(); this.intervalHandle = setInterval(() => { void this.processQueue(); }, Math.max(1_000, intervalMs)); }
  static stop(): void { this.isStopped = true; if (this.intervalHandle) { clearInterval(this.intervalHandle); this.intervalHandle = null; } }
  static resume(): void { this.start(); }
  static isStoppedState(): boolean { return this.isStopped; }

  static async resolveCanonicalUser(uid: string): Promise<Record<string, any> | null> {
    if (!uid?.trim()) return null;
    const userDocRef = dbGateway.doc(dbGateway.db, 'users', uid.trim());
    const snapshot = await dbGateway.getDoc(userDocRef);
    if (!snapshot.exists()) return null;
    return { ...(snapshot.data() || {}), id: uid.trim(), uid: uid.trim() };
  }

  static async processQueue() {
    if (this.isStopped || this.isProcessing || (typeof navigator !== 'undefined' && !navigator.onLine) || !SecurityContextService.isReady()) return;
    const activeSecCtx = SecurityContextService.getNullableContext();
    if (!activeSecCtx?.tenantId) return;
    this.isProcessing = true;
    try {
      await syncRepository.recoverStaleProcessingItems(activeSecCtx.tenantId);
      const items = await syncRepository.getPendingItems(activeSecCtx);
      for (const snapshot of items) {
        if (this.isStopped) break;
        const claimed = await syncRepository.claimItem(snapshot.id, activeSecCtx.tenantId);
        if (!claimed) continue;
        try { await this.processItem(claimed, activeSecCtx); } catch (err) { console.error(`[SyncEngine] Failed to process queue item ${claimed.id}:`, err); }
      }
      await syncRepository.clearCompleted(activeSecCtx.tenantId);
    } finally { this.isProcessing = false; }
  }

  /** Pull remote changes and persist a stable (updatedAt, documentId) checkpoint only after local materialization succeeds. */
  static async pullCollection(collectionName: string, tenantId: string, idField = 'id'): Promise<number> {
    if (!collectionName || !tenantId || !SecurityContextService.isReady()) return 0;
    const context = SecurityContextService.getNullableContext();
    if (!context?.tenantId) return 0;
    ArchitectureBoundaryEnforcer.enforceSyncEngineTenant(tenantId, context.tenantId, context.isDeveloper);
    const source = new FirestoreSyncDataSource();
    let cursor = await syncRepository.getDeltaCheckpoint(tenantId, collectionName);
    let synced = 0;
    for (;;) {
      const records = await source.pullDelta(collectionName, tenantId, cursor);
      if (!records.length) break;
      for (const record of records) if (await localSyncRepository.upsertSyncedRecord(collectionName, record as Record<string, unknown>, idField, tenantId)) synced++;
      const nextCursor = getNextDeltaCursor(records as Array<Record<string, unknown>>, cursor);
      if (!nextCursor) break;
      await syncRepository.saveDeltaCheckpoint(tenantId, collectionName, nextCursor);
      cursor = nextCursor;
      if (records.length < 100) break;
    }
    return synced;
  }

  private static async processItem(item: SyncQueueItem, activeSecCtx: SecurityContext) {
    ArchitectureBoundaryEnforcer.enforceSyncEngineTenant(item.tenantId, activeSecCtx.tenantId, activeSecCtx.isDeveloper);
    const operation = item.operation.toLowerCase();
    const customAction = item.metadata?.action;
    const colName = item.collection;
    const payload = (item.payload && typeof item.payload === 'object' ? item.payload : {}) as Record<string, any>;
    const tenantId = item.tenantId;
    try {
      const docId = item.recordId ?? payload?.id ?? payload?.docId ?? payload?.documentId ?? payload?.idUnik ?? payload?.uid ?? payload?.userUid ?? payload?.studentId ?? payload?.studentsId ?? payload?.teacherId ?? payload?.teachersId ?? payload?.userId ?? payload?.classId ?? payload?.classesId ?? payload?.scheduleId ?? payload?.journalId ?? payload?.letterId ?? payload?.pointId;
      if (!docId) { await syncRepository.moveToDeadLetterQueue(item.id, 'Document ID missing in payload', 'SYNC_QUEUE_ENTITY_ID_MISSING'); return; }
      const docRef = dbGateway.doc(dbGateway.db, colName, String(docId));
      const customActions = ['SCAN_PRESENSI', 'ADD_POINT', 'ATTENDANCE_PROCESS', 'BATCH_SYNC'];
      if (customAction && customActions.includes(customAction)) {
        const { SyncDispatcher } = await import('@/sync/SyncDispatcher'); await SyncDispatcher.dispatch(item as any, activeSecCtx);
      } else if (['create', 'update', 'patch', 'bulk_create', 'bulk_update'].includes(operation)) {
        let overwriteRemote = true;
        const docSnap = await dbGateway.getDoc(docRef);
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          const remoteVersion = Number(remoteData.version || 0);
          const remoteUpdatedAt = remoteData.updatedAt instanceof dbGateway.Timestamp ? remoteData.updatedAt.toMillis() : Number(remoteData.updatedAt || 0);
          const localVersion = Number(payload?.version ?? item.metadata?.version ?? 0);
          const localUpdatedAt = Number(payload?.updatedAt || 0);
          if (!shouldApplyMutationVersion(remoteVersion, localVersion) || (remoteVersion === localVersion && remoteUpdatedAt > localUpdatedAt)) {
            overwriteRemote = false;
            await localSyncRepository.upsertSyncedRecord(colName, remoteData as Record<string, unknown>, 'id', tenantId);
            auditLogger.log('SyncEnabled', tenantId, undefined, JSON.stringify({ event: 'SYNC_PUSH_CONFLICT_RESOLVED', actorId: activeSecCtx.uid || 'system', collection: colName, docId, resolution: 'KEEP_REMOTE', localVersion, remoteVersion, localUpdatedAt, remoteUpdatedAt }));
          }
        }
        if (overwriteRemote) {
          const localVersion = Number(payload?.version ?? item.metadata?.version ?? 0);
          if (localVersion < 1) throw Object.assign(new Error('SYNC_INVALID_VERSION: mutation version must be >= 1'), { code: 'SYNC_INVALID_VERSION' });
          const firestoreData = { ...payload, tenantId, version: localVersion, updatedAt: dbGateway.serverTimestamp(), syncStatus: SyncStatus.SYNCED };
          delete firestoreData.isOffline;
          await dbGateway.writeBatch(dbGateway.db).set(docRef, firestoreData, { merge: true }).commit();
          auditLogger.log('SyncEnabled', tenantId, undefined, JSON.stringify({ event: `SYNC_${operation.toUpperCase()}`, actorId: activeSecCtx.uid || 'system', collection: colName, docId, version: localVersion }));
        }
      } else if (operation === 'delete') {
        await dbGateway.writeBatch(dbGateway.db).delete(docRef).commit();
        auditLogger.log('SyncEnabled', tenantId, undefined, JSON.stringify({ event: 'SYNC_DELETE', actorId: activeSecCtx.uid || 'system', collection: colName, docId }));
      } else throw new Error(`Unsupported sync operation: ${item.operation}`);
      await syncRepository.updateStatus(item.id, 'completed');
      if (operation !== 'delete') await localSyncRepository.markRecordSynced(colName, String(docId));
    } catch (error: any) {
      const attempts = (item.attempts || 0) + 1;
      auditLogger.log('SyncBlocked', tenantId, undefined, JSON.stringify({ event: `SYNC_${item.operation.toUpperCase()}_ERROR`, actorId: activeSecCtx.uid || 'system', collection: item.collection, docId: item.recordId, error: error?.message || String(error), attempts }));
      if (attempts >= MAX_SYNC_ATTEMPTS) await syncRepository.moveToDeadLetterQueue(item.id, error?.message || 'Exceeded retry limit', error?.code || 'SYNC_MAX_RETRIES_EXCEEDED');
      else { await syncRepository.incrementRetry(item.id); await syncRepository.scheduleRetry(item.id, BASE_RETRY_DELAY_MS * (2 ** (attempts - 1))); }
      throw error;
    }
  }
  static async syncAll() { await this.processQueue(); }
  static async executeAutoSweepSync(_context: any, _tenantId: string) { await this.processQueue(); }
  static async executeClearPointsSync(context: SecurityContext, tenantId: string) {
    if (!tenantId) return;
    ArchitectureBoundaryEnforcer.enforceSyncEngineTenant(tenantId, context?.tenantId, context?.isDeveloper);
    const q = dbGateway.query(dbGateway.collection(dbGateway.db, 'poin'), dbGateway.where('tenantId', '==', tenantId));
    const snap = await dbGateway.getDocs(q); const batch = dbGateway.writeBatch(dbGateway.db); snap.docs.forEach((d: any) => batch.delete(d.ref)); await batch.commit();
  }
  static async executeBatchDeleteSync(context: SecurityContext, collName: string, filter: any) {
    const tenantId = context?.tenantId; if (!tenantId || !collName) return;
    ArchitectureBoundaryEnforcer.enforceSyncEngineTenant(tenantId, context.tenantId, context.isDeveloper);
    let q = dbGateway.query(dbGateway.collection(dbGateway.db, collName), dbGateway.where('tenantId', '==', tenantId));
    if (filter?.date) q = dbGateway.query(q, dbGateway.where('date', '==', filter.date));
    if (filter?.month) q = dbGateway.query(q, dbGateway.where('date', '>=', `${filter.month}-01`), dbGateway.where('date', '<=', `${filter.month}-31`));
    const snap = await dbGateway.getDocs(q); const batch = dbGateway.writeBatch(dbGateway.db); snap.docs.forEach((d: any) => batch.delete(d.ref)); await batch.commit();
  }
}

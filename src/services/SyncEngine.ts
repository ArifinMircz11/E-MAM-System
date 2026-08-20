/**
 * @license
 * e-Mam System - Sync Engine Core
 * LAYER: SERVICE (Architecture Compliant - Only Firestore Gateway)
 * Rule #3, #5, #80 AGENTS.md
 */

import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { db } from './firebase';
import { localDb } from '@/database/dexie';
import { syncRepository } from '@/repositories/SyncRepository';
import { SyncStatus } from '@/domain/entities/base';
import { AuditLogger } from './AuditLogger';
import type { SyncQueueItem } from '@/types';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';

export class SyncEngine {
  private static isProcessing = false;
  private static syncInterval: any = null;

  /**
   * Starts the Sync Engine background processing.
   */
  static async start(intervalMs: number = 30000) {
    if (!SecurityContextService.isReady()) {
      console.log('[SyncEngine] SecurityContext not READY. Background sync postponed.');
      return;
    }
    if (this.syncInterval) return;
    
    console.log(`🚀 [SyncEngine] Starting background sync process with interval ${intervalMs}ms...`);
    
    // Initial process
    this.processQueue();
    this.pullAllCoreCollections();

    // Periodic check
    this.syncInterval = setInterval(() => {
      this.processQueue();
      // Pull remote changes periodically
      this.pullAllCoreCollections();
    }, intervalMs);
  }

  /**
   * Stops the Sync Engine background processing.
   */
  static stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 [SyncEngine] Sync background process stopped.');
    }
  }

  /**
   * Pulls all core metadata collections for the active tenant.
   */
  static async pullAllCoreCollections() {
    const activeSecCtx = SecurityContextService.getNullableContext();
    if (!activeSecCtx || !activeSecCtx.tenantId || activeSecCtx.tenantId === 'global') return;

    const coreCollections = [
      'madrasah',
      'users',
      'students',
      'teachers',
      'classes',
      'subjects',
      'rooms',
      'academic_years',
      'semesters',
      'point_categories',
      'settings'
    ];

    console.log(`[SyncEngine] Pulling ${coreCollections.length} core collections for tenant ${activeSecCtx.tenantId}...`);
    
    for (const coll of coreCollections) {
      try {
        await this.pullCollection(coll, activeSecCtx.tenantId);
      } catch (err) {
        console.warn(`[SyncEngine] Periodic pull failed for ${coll}:`, err);
      }
    }
  }

  /**
   * Performs Delta Sync for a specific collection.
   * Pulls only records updated since the last sync, with robust conflict resolution.
   */
  static async pullCollection(collectionName: string, tenantId: string, idField: string = 'id') {
    if (!tenantId) return;

    // SecurityContext verification if available
    const activeSecCtx = SecurityContextService.getNullableContext();
    if (activeSecCtx) {
      ArchitectureBoundaryEnforcer.enforceSyncEngineTenant(
        tenantId,
        activeSecCtx.tenantId,
        activeSecCtx.isDeveloper
      );
    }

    try {
      // 1. Get the latest updatedAt from local Dexie for this collection and tenant
      const table = (localDb as any)[collectionName];
      if (!table) return;

      const lastRecord = await table
        .where('tenantId')
        .equals(tenantId)
        .reverse()
        .sortBy('updatedAt');
      
      let lastSyncedAt = lastRecord && lastRecord.length > 0 ? lastRecord[0].updatedAt : 0;
      if (lastSyncedAt === undefined || lastSyncedAt === null || isNaN(Number(lastSyncedAt))) {
        lastSyncedAt = 0;
      } else {
        lastSyncedAt = Number(lastSyncedAt);
      }

      // 2. Query Firestore for records updated AFTER lastSyncedAt
      let snapshot;
      try {
        const q = dbGateway.query(
          dbGateway.collection(db, collectionName),
          dbGateway.where('tenantId', '==', tenantId),
          dbGateway.where('updatedAt', '>', lastSyncedAt),
          dbGateway.orderBy('updatedAt', 'asc'),
          dbGateway.limit(500) // Safety limit
        );
        snapshot = await dbGateway.getDocs(q);
      } catch (queryErr: any) {
        const errStr = String(queryErr?.message || queryErr);
        if (errStr.includes('index') || queryErr?.code === 'failed-precondition') {
          console.warn(`[SyncEngine] Index building or missing for ${collectionName}. Falling back to single-field query...`);
          const fallbackQ = dbGateway.query(
            dbGateway.collection(db, collectionName),
            dbGateway.where('tenantId', '==', tenantId),
            dbGateway.limit(500)
          );
          snapshot = await dbGateway.getDocs(fallbackQ);
        } else {
          throw queryErr;
        }
      }

      if (!snapshot || snapshot.empty) return;

      // 3. Process each record with robust multi-device Conflict Resolution
      const recordsToPut: any[] = [];
      
      for (const docSnap of snapshot.docs) {
        const docId = docSnap.id;
        const incomingData = docSnap.data();
        const incomingUpdatedAt = incomingData.updatedAt instanceof dbGateway.Timestamp 
          ? incomingData.updatedAt.toMillis() 
          : (incomingData.updatedAt || 0);

        const incomingRecord = {
          ...incomingData,
          [idField]: docId,
          syncStatus: SyncStatus.SYNCED,
          updatedAt: incomingUpdatedAt
        };

        const localRecord = await table.get(docId);

        // Detect potential conflict if local record exists and is locally modified (pending or failed sync)
        if (localRecord && (localRecord.syncStatus === 'pending' || localRecord.syncStatus === 'failed')) {
          const localVersion = localRecord.version || 0;
          const incomingVersion = incomingRecord.version || 0;
          const localUpdatedAt = localRecord.updatedAt || 0;

          let resolution: 'OVERWRITE_LOCAL' | 'KEEP_LOCAL';

          // Resolution Rule 1: Version-based comparison
          if (localVersion !== incomingVersion) {
            resolution = localVersion > incomingVersion ? 'KEEP_LOCAL' : 'OVERWRITE_LOCAL';
          } 
          // Resolution Rule 2: Timestamp (updatedAt)-based comparison
          else if (localUpdatedAt !== incomingUpdatedAt) {
            resolution = localUpdatedAt > incomingUpdatedAt ? 'KEEP_LOCAL' : 'OVERWRITE_LOCAL';
          } 
          // Resolution Rule 3: Manual/Fallback: Offline edits take priority
          else {
            resolution = 'KEEP_LOCAL';
          }

          // Register and write the resolution event to the system audit logs
          await AuditLogger.log(
            SecurityContextService.getNullableContext()?.uid || 'system',
            'SYNC_CONFLICT_RESOLVED',
            'SyncEngine',
            resolution === 'KEEP_LOCAL' ? 'warning' : 'success',
            {
              collection: collectionName,
              docId,
              tenantId,
              resolution,
              localVersion,
              incomingVersion,
              localUpdatedAt,
              incomingUpdatedAt
            }
          );

          if (resolution === 'OVERWRITE_LOCAL') {
            recordsToPut.push(incomingRecord);
            // Delete corresponding pending items in the queue to maintain data integrity
            const pendingQueueItems = await localDb.sync_queue
              .where('collection')
              .equals(collectionName)
              .toArray();
            
            for (const qItem of pendingQueueItems) {
              const qDocId = qItem.payload?.id || qItem.payload?.idUnik || qItem.payload?.studentsId || qItem.payload?.uid;
              if (qDocId === docId) {
                await localDb.sync_queue.delete(qItem.id);
              }
            }
          } else {
            console.log(`[SyncEngine] Conflict resolved on ${collectionName}/${docId}: Preserved newer local version.`);
          }
        } else {
          // No conflict, safe to put
          recordsToPut.push(incomingRecord);
        }
      }

      if (recordsToPut.length > 0) {
        await table.bulkPut(recordsToPut);
        console.log(`[SyncEngine] Pulled and resolved ${recordsToPut.length} of ${snapshot.docs.length} records for ${collectionName}`);
      }
      
    } catch (error) {
      console.error(`[SyncEngine] Pull failed for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Processes the Sync Queue (Push local changes to Firestore via Firestore Gateway)
   */
  static async processQueue() {
    if (this.isProcessing || !navigator.onLine) return;

    // 1. Enforce active SecurityContext readiness (Fail Closed - WAITING state if not ready)
    if (!SecurityContextService.isReady()) {
      return;
    }

    const activeSecCtx = SecurityContextService.getNullableContext();
    if (!activeSecCtx || !activeSecCtx.tenantId) {
      return;
    }

    this.isProcessing = true;

    try {
      const items = await syncRepository.getPendingItems();
      if (items.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`[SyncEngine] Processing ${items.length} items in queue for tenant ${activeSecCtx.tenantId}...`);

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
      await AuditLogger.log(
        'system',
        'SYNC_SECURITY_CONTEXT_MISSING',
        'SyncEngine',
        'error',
        { itemId: item.id, reason: 'SecurityContext null pada processItem.' }
      );
      throw new ArchitectureBoundaryError(
        'sync_engine',
        'SYNC_SECURITY_CONTEXT_MISSING',
        'SecurityContext tidak ditemukan saat memproses item sinkronisasi.'
      );
    }

    // 1. Enforce Sync Engine Tenant Boundary against active SecurityContext (Fail Closed)
    ArchitectureBoundaryEnforcer.enforceSyncEngineTenant(
      item.tenantId,
      activeSecCtx.tenantId,
      activeSecCtx.isDeveloper
    );

    // 2. Update status to processing
    await syncRepository.updateStatus(item.id, 'processing');

    try {
      const { action, collection: colName, payload, tenantId } = item;
      
      let docId: string | undefined =
        (item as any).documentId ||
        payload?.id ||
        payload?.docId ||
        payload?.documentId ||
        payload?.idUnik ||
        payload?.uid ||
        payload?.userUid ||
        payload?.studentId ||
        payload?.studentsId ||
        payload?.teacherId ||
        payload?.teachersId ||
        payload?.userId ||
        payload?.classId ||
        payload?.classesId ||
        payload?.scheduleId ||
        payload?.journalId ||
        payload?.letterId ||
        payload?.pointId;

      if (!docId && payload && typeof payload === 'object') {
        for (const key of Object.keys(payload)) {
          if (key.toLowerCase().endsWith('id') && payload[key] && typeof payload[key] !== 'object') {
            docId = String(payload[key]);
            break;
          }
        }
      }

      if (!docId && (typeof payload === 'string' || typeof payload === 'number')) {
        docId = String(payload);
      }

      if (!docId) {
        console.warn(`[SyncEngine] Document ID missing in payload for item ${item.id} (${colName}/${action}). Moving to DLQ.`);
        await syncRepository.moveToDeadLetterQueue(item.id, 'Document ID missing in payload', 'SYNC_QUEUE_ENTITY_ID_MISSING');
        return;
      }

      const docRef = dbGateway.doc(db, colName, docId);

      // 3. Perform Firestore operation with Conflict Resolution
      const isCustomAction = ['SCAN_PRESENSI', 'ADD_POINT', 'ATTENDANCE_PROCESS', 'BATCH_SYNC'].includes(action);

      if (isCustomAction) {
        // Delegate custom business operations to SyncDispatcher
        const { SyncDispatcher } = await import('@/sync/SyncDispatcher');
        await SyncDispatcher.dispatch(item as any, activeSecCtx);
      } else if (action === 'CREATE' || action === 'UPDATE') {
        let overwriteRemote = true;

        try {
          const docSnap = await dbGateway.getDoc(docRef);
          if (docSnap.exists()) {
            const remoteData = docSnap.data();
            const remoteVersion = remoteData.version || 0;
            const remoteUpdatedAt = remoteData.updatedAt instanceof dbGateway.Timestamp 
              ? remoteData.updatedAt.toMillis() 
              : (remoteData.updatedAt || 0);

            const localVersion = payload.version || 0;
            const localUpdatedAt = payload.updatedAt || 0;

            if (remoteVersion > localVersion || (remoteVersion === localVersion && remoteUpdatedAt > localUpdatedAt)) {
              // Remote is newer!
              overwriteRemote = false;

              // Register conflict resolution event (REMOTE WINS)
              await AuditLogger.log(
                activeSecCtx?.uid || 'system',
                'SYNC_PUSH_CONFLICT_RESOLVED',
                'SyncEngine',
                'warning',
                {
                  collection: colName,
                  docId,
                  tenantId,
                  resolution: 'KEEP_REMOTE',
                  localVersion,
                  remoteVersion,
                  localUpdatedAt,
                  remoteUpdatedAt
                }
              );
            }
          }
        } catch (fetchErr) {
          console.warn(`[SyncEngine] Pre-write read failed (possibly offline or read restricted):`, fetchErr);
        }

        if (overwriteRemote) {
          const firestoreData = {
            ...payload,
            tenantId,
            updatedAt: dbGateway.serverTimestamp(),
            syncStatus: SyncStatus.SYNCED
          };
          
          // Remove local-only fields if any
          delete (firestoreData as any).isOffline;

          await dbGateway.writeBatch(db).set(docRef, firestoreData, { merge: true }).commit();
          
          await AuditLogger.log(
            activeSecCtx?.uid || 'system',
            `SYNC_${action}`,
            'SyncEngine',
            'success',
            { collection: colName, docId, tenantId }
          );
        } else {
          console.log(`[SyncEngine] Conflict resolved on push: Kept newer remote version for ${colName}/${docId}`);
        }
      } else if (action === 'DELETE') {
        await dbGateway.writeBatch(db).delete(docRef).commit();
        
        await AuditLogger.log(
          activeSecCtx?.uid || 'system',
          `SYNC_DELETE`,
          'SyncEngine',
          'success',
          { collection: colName, docId, tenantId }
        );
      }

      // 4. Mark as completed and update local syncStatus in Dexie
      await syncRepository.updateStatus(item.id, 'completed');
      
      const table = (localDb as any)[colName];
      if (table) {
        await table.update(docId, { syncStatus: SyncStatus.SYNCED });
      }

    } catch (error: any) {
      const retryCount = (item.retryCount || 0) + 1;
      
      await AuditLogger.log(
        activeSecCtx?.uid || 'system',
        `SYNC_${item.action}_ERROR`,
        'SyncEngine',
        'error',
        { collection: item.collection, docId: item.payload?.id, tenantId: item.tenantId, error: error.message, retryCount }
      );

      if (retryCount >= 5) {
        console.warn(`[SyncEngine] Max retries reached for item ${item.id}. Moving to Dead Letter Queue.`);
        await syncRepository.moveToDeadLetterQueue(item.id, error.message || 'Exceeded retry limit', error.code || 'SYNC_MAX_RETRIES_EXCEEDED');
      } else {
        await syncRepository.incrementRetry(item.id);
        await syncRepository.updateStatus(item.id, 'pending', error.message);
      }
      throw error;
    }
  }

  static async syncAll() {
    console.log('[SyncEngine] Triggering full syncAll...');
    await this.processQueue();
  }

  static async executeAutoSweepSync(context: any, tenantId: string) {
    console.log(`[SyncEngine] Running Auto Sweep for tenant: ${tenantId}...`);
    await this.processQueue();
  }

  static async executeClearPointsSync(context: any, tenantId: string) {
    if (!tenantId) return;
    const q = dbGateway.query(dbGateway.collection(db, 'poin'), dbGateway.where('tenantId', '==', tenantId));
    const poinSnap = await dbGateway.getDocs(q);
    const batch = dbGateway.writeBatch(db);
    poinSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  static async executeBatchDeleteSync(context: any, collName: string, filter: any) {
    const tenantId = context?.tenantId;
    if (!tenantId) return;
    let q = dbGateway.query(dbGateway.collection(db, collName), dbGateway.where('tenantId', '==', tenantId));
    if (filter?.date) q = dbGateway.query(q, dbGateway.where('date', '==', filter.date));
    if (filter?.month) {
      q = dbGateway.query(
        q,
        dbGateway.where('date', '>=', `${filter.month}-01`),
        dbGateway.where('date', '<=', `${filter.month}-31`),
      );
    }
    const snap = await dbGateway.getDocs(q);
    const batch = dbGateway.writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}


import { localDb, DatabaseResolver, type EMamDatabase } from '@/database/dexie';
import type { SyncQueueItem } from '@/types';
import { ensureStringIds } from '@/utils/schemaHelpers';
import { getSecurityContext } from '@/core/security/contextHelper';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import type { SecurityContext } from '@/core/security/types';

/**
 * SyncRepository
 *
 * Manages the offline synchronization queue in Dexie.
 * Single Authoritative Manager for Sync Queue Operations.
 * Enforces strict Fail-Closed Sync Queue Boundaries.
 */
export class SyncRepository {
  private get db(): EMamDatabase {
    return DatabaseResolver.getDatabase();
  }

  /**
   * Adds an item to the sync queue with strict architecture boundary validation.
   */
  async enqueue(
    item: Omit<SyncQueueItem, 'id' | 'status' | 'createdAt' | 'retryCount' | 'attempts' | 'operation' | 'action'> & {
      action?: string;
      operation?: string;
    },
    context?: SecurityContext,
    options: { triggerSync?: boolean; db?: any } = { triggerSync: true }
  ) {
    // 1. Get active SecurityContext
    const activeSecCtx = context || getSecurityContext(false);
    const tenantId = item.tenantId || activeSecCtx?.tenantId;
    const actorUid = activeSecCtx?.uid || (item as any).createdBy || 'system';

    // 2. Sanitize payload to ensure ID String Protocol
    const sanitizedPayload = ensureStringIds(item.payload);

    // 3. Extract or infer document ID
    let docId =
      (item as any).documentId ||
      (item as any).entityId ||
      sanitizedPayload?.id ||
      sanitizedPayload?.idUnik ||
      sanitizedPayload?.uid ||
      sanitizedPayload?.userId ||
      sanitizedPayload?.studentId ||
      sanitizedPayload?.studentsId ||
      sanitizedPayload?.teacherId ||
      sanitizedPayload?.teachersId ||
      sanitizedPayload?.classId;

    if (!docId && sanitizedPayload && typeof sanitizedPayload === 'object') {
      for (const key of Object.keys(sanitizedPayload)) {
        if (key.toLowerCase().endsWith('id') && sanitizedPayload[key] && typeof sanitizedPayload[key] !== 'object') {
          docId = String(sanitizedPayload[key]);
          break;
        }
      }
    }

    if (sanitizedPayload && typeof sanitizedPayload === 'object' && docId && !sanitizedPayload.id) {
      sanitizedPayload.id = String(docId);
    }

    const id = `SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const originalAction = (item.action || (item as any).operation || 'UPDATE').toUpperCase();

    // Map original action to canonical SyncOperation (lowercase)
    let operation: 'create' | 'update' | 'delete' | 'patch' | 'bulk_create' | 'bulk_update' = 'update';
    let metadataAction = ((item.metadata as any)?.action || item.action || '').toLowerCase();

    if (originalAction === 'CREATE' || originalAction === 'CREATE_STUDENT' || originalAction === 'CREATE_TEACHER') {
      operation = 'create';
    } else if (originalAction === 'DELETE' || originalAction === 'DELETE_STUDENT' || originalAction === 'DELETE_TEACHER') {
      operation = 'delete';
    } else if (originalAction === 'PATCH') {
      operation = 'patch';
    } else if (originalAction === 'BULK_CREATE') {
      operation = 'bulk_create';
    } else if (originalAction === 'BULK_UPDATE') {
      operation = 'bulk_update';
    } else if (originalAction === 'SCAN_PRESENSI' || originalAction === 'ADD_POINT') {
      operation = 'create';
    } else if (originalAction === 'ATTENDANCE_PROCESS' || originalAction === 'AUTO_SWEEP' || originalAction === 'REPAIR_POINTS') {
      operation = 'patch';
    } else if (originalAction === 'BATCH_SYNC') {
      operation = 'bulk_create';
    } else if (originalAction === 'BATCH_DELETE') {
      operation = 'delete';
    }

    const candidateItem: SyncQueueItem = {
      ...item,
      id,
      tenantId: tenantId as string,
      operation,
      collection: item.collection,
      recordId: docId ? String(docId) : undefined,
      payload: sanitizedPayload,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        action: metadataAction,
        actorId: actorUid,
        idempotencyKey: (item as any).metadata?.idempotencyKey || id,
      },

      // Backward compatibility fields
      action: originalAction as any,
      retryCount: 0,
      error: undefined,
      createdBy: (item as any).createdBy || actorUid,
      updatedBy: (item as any).updatedBy || actorUid,
      entityId: docId ? String(docId) : (item as any).entityId,
      entityType: item.collection,
      operationId: (item as any).operationId || id,
      correlationId: (item as any).correlationId || `CORR_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      documentId: docId ? String(docId) : undefined,
    } as any;

    // 4. Enforce Sync Queue Boundary before inserting to Dexie
    ArchitectureBoundaryEnforcer.enforceSyncQueue(candidateItem, activeSecCtx);

    const dbInstance = options.db || this.db;
    const res = await dbInstance.sync_queue.add(candidateItem);

    // 5. Trigger instant background auto-sync if online
    if (options.triggerSync && typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        import('@/services/SyncEngine').then(({ SyncEngine }) => {
          SyncEngine.processQueue().catch((err) =>
            console.warn('[SyncRepository] Background auto-sync trigger warning:', err)
          );
        });
      }, 100);
    }

    return res;
  }

  async getPendingItems(): Promise<SyncQueueItem[]> {
    return await this.db.sync_queue
      .where('status')
      .anyOf(['pending', 'waiting', 'failed'])
      .toArray();
  }

  async findPendingItems(tenantId: string): Promise<SyncQueueItem[]> {
    if (!tenantId) return [];
    const items = await this.db.sync_queue
      .where('tenantId')
      .equals(tenantId)
      .toArray();
    return items
      .filter((i) => ['pending', 'waiting', 'failed'].includes(i.status))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter',
    error?: string,
  ) {
    return await this.db.sync_queue.update(id, {
      status,
      error,
      lastError: error,
      updatedAt: Date.now(),
    });
  }

  async incrementRetry(id: string) {
    const item = await this.db.sync_queue.get(id);
    if (item) {
      const newAttempts = (item.attempts || item.retryCount || 0) + 1;
      return await this.db.sync_queue.update(id, {
        attempts: newAttempts,
        retryCount: newAttempts,
        updatedAt: Date.now(),
      });
    }
    return null;
  }

  /**
   * Moves a permanently failed item to the Dead Letter Queue,
   * strictly preserving tenant context, actor context, version, and error details.
   */
  async moveToDeadLetterQueue(id: string, reason: string, errorCode: string = 'SYNC_MAX_RETRIES_EXCEEDED') {
    const item = await this.db.sync_queue.get(id);
    if (!item) return null;

    const dlqItem = {
      id: item.id,
      tenantId: item.tenantId,
      tenantsId: (item as any).tenantsId || item.tenantId,
      collection: item.collection,
      entityId: (item as any).entityId || item.documentId || item.payload?.id,
      operation: item.action || (item as any).operation,
      payload: item.payload,
      version: item.payload?.version || 1,
      errorCode,
      errorReason: reason,
      createdBy: (item as any).createdBy || 'system',
      updatedBy: (item as any).updatedBy || 'system',
      status: 'dead_letter',
      retryCount: item.retryCount || 0,
      createdAt: item.createdAt || Date.now(),
      failedAt: Date.now(),
    };

    const activeDb = this.db;
    await activeDb.transaction('rw', [activeDb.sync_queue, activeDb.dead_letter_queue], async () => {
      await activeDb.dead_letter_queue.put(dlqItem);
      await activeDb.sync_queue.delete(id);
    });

    return dlqItem;
  }

  async getDeadLetterItems(tenantId?: string): Promise<any[]> {
    if (tenantId) {
      return await this.db.dead_letter_queue
        .where('tenantId')
        .equals(tenantId)
        .sortBy('failedAt');
    }
    return await this.db.dead_letter_queue.toArray();
  }

  async remove(id: string) {
    return await this.db.sync_queue.delete(id);
  }

  async clearCompleted() {
    return await this.db.sync_queue.where('status').equals('completed').delete();
  }
}

export const syncRepository = new SyncRepository();

import { DatabaseResolver, type EMamDatabase } from '@/database/dexie';
import type { DeadLetterQueueItem, SyncOperation, SyncQueueItem, SyncQueueStatus } from '@/types';
import { ensureStringIds } from '@/utils/schemaHelpers';
import { getSecurityContext } from '@/core/security/contextHelper';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import type { SecurityContext } from '@/core/security/types';

/**
 * SyncRepository
 *
 * Single authoritative manager for the offline synchronization queue.
 * Dexie stores only the canonical SyncQueueItem / DeadLetterQueueItem contracts.
 */
export class SyncRepository {
  private get db(): EMamDatabase {
    return DatabaseResolver.getDatabase();
  }

  async enqueue(
    item: Omit<SyncQueueItem, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'attempts' | 'operation'> & {
      operation?: SyncOperation;
      metadata?: SyncQueueItem['metadata'];
    },
    context?: SecurityContext,
    options: { triggerSync?: boolean; db?: EMamDatabase } = { triggerSync: true },
  ) {
    const activeSecCtx = context || getSecurityContext(false);
    if (!activeSecCtx?.uid || !activeSecCtx.tenantId) {
      throw new Error('SYNC_QUEUE_SECURITY_CONTEXT_INVALID: SecurityContext wajib tersedia saat enqueue.');
    }

    const requestedTenantId = item.tenantId;
    const tenantId = activeSecCtx.tenantId;
    const isExplicitGlobalScope = activeSecCtx.isDeveloper && tenantId === 'global';

    if (!isExplicitGlobalScope && requestedTenantId && requestedTenantId !== tenantId) {
      ArchitectureBoundaryEnforcer.enforceTenantAccess(
        tenantId,
        requestedTenantId,
        'sync_queue',
        activeSecCtx.isDeveloper,
      );
    }

    const actorUid = activeSecCtx.uid;
    const sanitizedPayload = ensureStringIds(item.payload);
    let docId = item.recordId;

    if (!docId && sanitizedPayload && typeof sanitizedPayload === 'object') {
      const candidate = sanitizedPayload as Record<string, unknown>;
      const preferredKeys = [
        'id', 'idUnik', 'uid', 'userId', 'studentId', 'studentsId',
        'teacherId', 'teachersId', 'classId', 'classesId',
      ];
      for (const key of preferredKeys) {
        if (candidate[key] && typeof candidate[key] !== 'object') {
          docId = String(candidate[key]);
          break;
        }
      }
      if (!docId) {
        for (const key of Object.keys(candidate)) {
          if (key.toLowerCase().endsWith('id') && candidate[key] && typeof candidate[key] !== 'object') {
            docId = String(candidate[key]);
            break;
          }
        }
      }
    }

    if (sanitizedPayload && typeof sanitizedPayload === 'object' && docId && !sanitizedPayload.id) {
      sanitizedPayload.id = String(docId);
    }

    const id = `SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const operation = item.operation ?? 'update';

    const candidateItem: SyncQueueItem = {
      id,
      tenantId,
      operation,
      collection: item.collection,
      recordId: docId ? String(docId) : undefined,
      payload: sanitizedPayload,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        ...(item.metadata ?? {}),
        actorId: item.metadata?.actorId ?? actorUid,
        idempotencyKey: item.metadata?.idempotencyKey ?? id,
      },
    };

    ArchitectureBoundaryEnforcer.enforceSyncQueue(candidateItem, activeSecCtx);

    const dbInstance = options.db || this.db;
    const res = await dbInstance.sync_queue.add(candidateItem);

    if (options.triggerSync && typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        import('@/services/SyncEngine').then(({ SyncEngine }) => {
          SyncEngine.processQueue().catch((err) =>
            console.warn('[SyncRepository] Background auto-sync trigger warning:', err),
          );
        });
      }, 100);
    }

    return res;
  }

  async getPendingItems(context?: SecurityContext): Promise<SyncQueueItem[]> {
    const activeSecCtx = context || getSecurityContext(false);
    if (!activeSecCtx?.tenantId) return [];

    const items = await this.db.sync_queue
      .where('tenantId')
      .equals(activeSecCtx.tenantId)
      .toArray();

    return items
      .filter((i) => ['pending', 'waiting', 'failed'].includes(i.status))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }

  async findPendingItems(tenantId: string): Promise<SyncQueueItem[]> {
    if (!tenantId) return [];
    const items = await this.db.sync_queue.where('tenantId').equals(tenantId).toArray();
    return items
      .filter((i) => ['pending', 'waiting', 'failed'].includes(i.status))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }

  async updateStatus(id: string, status: SyncQueueStatus, error?: string) {
    return await this.db.sync_queue.update(id, {
      status,
      lastError: error,
      updatedAt: Date.now(),
    });
  }

  async incrementRetry(id: string) {
    const item = await this.db.sync_queue.get(id);
    if (!item) return null;

    const newAttempts = (item.attempts || 0) + 1;
    return await this.db.sync_queue.update(id, {
      attempts: newAttempts,
      updatedAt: Date.now(),
    });
  }

  async markRecordSynced(collection: string, recordId: string) {
    if (!collection || !recordId) return 0;
    const table = (this.db as unknown as Record<string, { update?: (key: string, changes: Record<string, unknown>) => Promise<number> }>)[collection];
    if (!table?.update) return 0;
    return await table.update(String(recordId), { syncStatus: 'synced' });
  }

  async moveToDeadLetterQueue(
    id: string,
    reason: string,
    errorCode = 'SYNC_MAX_RETRIES_EXCEEDED',
  ): Promise<DeadLetterQueueItem | null> {
    const item = await this.db.sync_queue.get(id);
    if (!item) return null;

    const dlqItem: DeadLetterQueueItem = {
      id: item.id,
      tenantId: item.tenantId,
      tenantsId: item.tenantId,
      collection: item.collection,
      entityId: item.recordId,
      operation: item.operation,
      payload: item.payload,
      version: item.metadata?.version || 1,
      errorCode,
      errorReason: reason,
      createdBy: item.metadata?.actorId || 'system',
      updatedBy: item.metadata?.actorId || 'system',
      status: 'dead_letter',
      retryCount: item.attempts,
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

  async getDeadLetterItems(tenantId?: string): Promise<DeadLetterQueueItem[]> {
    if (tenantId) {
      return await this.db.dead_letter_queue.where('tenantId').equals(tenantId).sortBy('failedAt');
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

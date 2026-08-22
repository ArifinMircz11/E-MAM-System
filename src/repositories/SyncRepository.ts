import { DatabaseResolver, type EMamDatabase } from '@/database/dexie';
import type { DeadLetterQueueItem, SyncOperation, SyncQueueItem, SyncQueueStatus } from '@/types';
import { ensureStringIds } from '@/utils/schemaHelpers';
import { getSecurityContext } from '@/core/security/contextHelper';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import type { SecurityContext } from '@/core/security/types';

const PROCESSING_RECOVERY_TIMEOUT_MS = 60_000;
const MAX_SYNC_ATTEMPTS = 5;

type EnqueueItem = Omit<SyncQueueItem, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'attempts' | 'operation'> & {
  operation?: SyncOperation;
  metadata?: SyncQueueItem['metadata'];
};

export class SyncRepository {
  private get db(): EMamDatabase {
    return DatabaseResolver.getDatabase();
  }

  private async coalesceUnsentMutation(
    dbInstance: EMamDatabase,
    candidate: SyncQueueItem,
  ): Promise<{ id: string } | null> {
    if (!candidate.recordId) return null;
    const candidates = await dbInstance.sync_queue
      .where('tenantId').equals(candidate.tenantId)
      .filter((item) =>
        item.collection === candidate.collection &&
        item.recordId === candidate.recordId &&
        (item.status === 'pending' || item.status === 'waiting' || item.status === 'failed'),
      )
      .sortBy('createdAt');
    const existing = candidates[0];
    if (!existing) return null;

    const changes: Partial<SyncQueueItem> = {
      payload: candidate.payload,
      recordId: candidate.recordId,
      metadata: candidate.metadata,
      status: 'pending',
      updatedAt: Date.now(),
    };

    if (existing.operation === 'create' && candidate.operation !== 'delete') {
      await dbInstance.sync_queue.update(existing.id, { ...changes, operation: 'create' });
      return { id: existing.id };
    }
    if (existing.operation === 'create' && candidate.operation === 'delete') {
      await dbInstance.sync_queue.delete(existing.id);
      return { id: existing.id };
    }
    if (
      (existing.operation === 'update' || existing.operation === 'patch') &&
      (candidate.operation === 'update' || candidate.operation === 'patch')
    ) {
      await dbInstance.sync_queue.update(existing.id, { ...changes, operation: candidate.operation });
      return { id: existing.id };
    }
    if (
      (existing.operation === 'update' || existing.operation === 'patch') &&
      candidate.operation === 'delete'
    ) {
      await dbInstance.sync_queue.update(existing.id, { ...changes, operation: 'delete' });
      return { id: existing.id };
    }
    return null;
  }

  async enqueue(
    item: EnqueueItem,
    context?: SecurityContext,
    options: { triggerSync?: boolean; db?: EMamDatabase } = { triggerSync: true },
  ): Promise<string> {
    const activeSecCtx = context || getSecurityContext(false);
    if (!activeSecCtx?.uid || !activeSecCtx.tenantId) {
      throw new Error('SYNC_QUEUE_SECURITY_CONTEXT_INVALID: SecurityContext wajib tersedia saat enqueue.');
    }
    const requestedTenantId = item.tenantId;
    const tenantId = activeSecCtx.tenantId;
    const isExplicitGlobalScope = activeSecCtx.isDeveloper && tenantId === 'global';
    if (!isExplicitGlobalScope && requestedTenantId && requestedTenantId !== tenantId) {
      ArchitectureBoundaryEnforcer.enforceTenantAccess(tenantId, requestedTenantId, 'sync_queue', activeSecCtx.isDeveloper);
    }
    const actorUid = activeSecCtx.uid;
    const sanitizedPayload = ensureStringIds(item.payload);
    let docId = item.recordId;
    if (!docId && sanitizedPayload && typeof sanitizedPayload === 'object') {
      const candidate = sanitizedPayload as Record<string, unknown>;
      const preferredKeys = ['id', 'idUnik', 'uid', 'userId', 'studentId', 'studentsId', 'teacherId', 'teachersId', 'classId', 'classesId'];
      for (const key of preferredKeys) {
        if (candidate[key] && typeof candidate[key] !== 'object') { docId = String(candidate[key]); break; }
      }
      if (!docId) {
        for (const key of Object.keys(candidate)) {
          if (key.toLowerCase().endsWith('id') && candidate[key] && typeof candidate[key] !== 'object') { docId = String(candidate[key]); break; }
        }
      }
    }
    if (sanitizedPayload && typeof sanitizedPayload === 'object' && docId && !sanitizedPayload.id) {
      (sanitizedPayload as Record<string, unknown>).id = String(docId);
    }
    const id = `SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const operation = item.operation ?? 'update';
    const now = Date.now();
    const candidateItem: SyncQueueItem = {
      id,
      tenantId,
      operation,
      collection: item.collection,
      recordId: docId ? String(docId) : undefined,
      payload: sanitizedPayload,
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      metadata: { ...(item.metadata ?? {}), actorId: item.metadata?.actorId ?? actorUid, idempotencyKey: item.metadata?.idempotencyKey ?? id },
    };
    ArchitectureBoundaryEnforcer.enforceSyncQueue(candidateItem, activeSecCtx);
    const dbInstance = options.db || this.db;
    const coalesced = await this.coalesceUnsentMutation(dbInstance, candidateItem);
    const res = coalesced?.id ?? await dbInstance.sync_queue.add(candidateItem);
    if (options.triggerSync && typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        import('@/services/SyncEngine').then(({ SyncEngine }) => {
          SyncEngine.processQueue().catch((err) => console.warn('[SyncRepository] Background auto-sync trigger warning:', err));
        });
      }, 100);
    }
    return res;
  }

  async recoverStaleProcessingItems(tenantId: string): Promise<number> {
    if (!tenantId) return 0;
    const cutoff = Date.now() - PROCESSING_RECOVERY_TIMEOUT_MS;
    const staleItems = (await this.db.sync_queue.where('tenantId').equals(tenantId).toArray())
      .filter((item) => item.status === 'processing' && (item.updatedAt ?? item.createdAt) <= cutoff);
    let recovered = 0;
    for (const item of staleItems) {
      const attempts = item.attempts || 0;
      if (attempts >= MAX_SYNC_ATTEMPTS) {
        await this.moveToDeadLetterQueue(item.id, 'Queue item remained processing beyond recovery timeout', 'SYNC_PROCESSING_STALE');
      } else {
        const updated = await this.db.sync_queue.update(item.id, {
          status: 'waiting', lastError: 'Recovered stale processing item after interrupted sync execution',
          nextRetryAt: new Date().toISOString(), updatedAt: Date.now(),
        });
        recovered += updated;
      }
    }
    return recovered;
  }

  async getPendingItems(context?: SecurityContext): Promise<SyncQueueItem[]> {
    const activeSecCtx = context || getSecurityContext(false);
    if (!activeSecCtx?.tenantId) return [];
    const items = await this.db.sync_queue.where('tenantId').equals(activeSecCtx.tenantId).toArray();
    const now = Date.now();
    return items.filter((i) =>
      i.status === 'pending' || i.status === 'failed' ||
      (i.status === 'waiting' && (!i.nextRetryAt || Date.parse(i.nextRetryAt) <= now)),
    ).sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0));
  }

  async claimItem(id: string, tenantId: string): Promise<SyncQueueItem | null> {
    if (!id || !tenantId) return null;
    return await this.db.transaction('rw', this.db.sync_queue, async () => {
      const item = await this.db.sync_queue.get(id);
      if (!item || item.tenantId !== tenantId) return null;
      const now = Date.now();
      const eligible = item.status === 'pending' || item.status === 'failed' ||
        (item.status === 'waiting' && (!item.nextRetryAt || Date.parse(item.nextRetryAt) <= now));
      if (!eligible) return null;
      const updated: SyncQueueItem = { ...item, status: 'processing', updatedAt: now };
      await this.db.sync_queue.put(updated);
      return updated;
    });
  }

  async findPendingItems(tenantId: string): Promise<SyncQueueItem[]> {
    if (!tenantId) return [];
    const items = await this.db.sync_queue.where('tenantId').equals(tenantId).toArray();
    const now = Date.now();
    return items.filter((i) => i.status === 'pending' || i.status === 'failed' ||
      (i.status === 'waiting' && (!i.nextRetryAt || Date.parse(i.nextRetryAt) <= now)))
      .sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0));
  }

  async updateStatus(id: string, status: SyncQueueStatus, error?: string) {
    const changes: Partial<SyncQueueItem> = { status, updatedAt: Date.now() };
    if (error !== undefined) changes.lastError = error;
    return await this.db.sync_queue.update(id, changes);
  }

  async incrementRetry(id: string) {
    const item = await this.db.sync_queue.get(id);
    if (!item) return null;
    const newAttempts = (item.attempts || 0) + 1;
    return await this.db.sync_queue.update(id, { attempts: newAttempts, updatedAt: Date.now() });
  }

  async scheduleRetry(id: string, delayMs: number) {
    if (!Number.isFinite(delayMs) || delayMs < 0) throw new Error('SYNC_RETRY_DELAY_INVALID');
    return await this.db.sync_queue.update(id, { status: 'waiting', nextRetryAt: new Date(Date.now() + delayMs).toISOString(), updatedAt: Date.now() });
  }

  async markRecordSynced(collection: string, recordId: string) {
    if (!collection || !recordId) return 0;
    const table = (this.db as unknown as Record<string, { update?: (key: string, changes: Record<string, unknown>) => Promise<number> }>)[collection];
    if (!table?.update) return 0;
    return await table.update(String(recordId), { syncStatus: 'synced' });
  }

  async moveToDeadLetterQueue(id: string, reason: string, errorCode = 'SYNC_MAX_RETRIES_EXCEEDED'): Promise<DeadLetterQueueItem | null> {
    const item = await this.db.sync_queue.get(id);
    if (!item) return null;
    const dlqItem: DeadLetterQueueItem = {
      id: item.id, tenantId: item.tenantId, tenantsId: item.tenantId, collection: item.collection,
      entityId: item.recordId, operation: item.operation, payload: item.payload, version: item.metadata?.version || 1,
      errorCode, errorReason: reason, createdBy: item.metadata?.actorId || 'system', updatedBy: item.metadata?.actorId || 'system',
      status: 'dead_letter', retryCount: item.attempts, createdAt: item.createdAt || Date.now(), failedAt: Date.now(),
    };
    await this.db.transaction('rw', [this.db.sync_queue, this.db.dead_letter_queue], async () => {
      await this.db.dead_letter_queue.put(dlqItem);
      await this.db.sync_queue.delete(id);
    });
    return dlqItem;
  }

  async getDeadLetterItems(tenantId?: string): Promise<DeadLetterQueueItem[]> {
    if (tenantId) return await this.db.dead_letter_queue.where('tenantId').equals(tenantId).sortBy('failedAt');
    return await this.db.dead_letter_queue.toArray();
  }

  async remove(id: string) { return await this.db.sync_queue.delete(id); }
  async clearCompleted(tenantId: string) {
    if (!tenantId) return 0;
    return await this.db.sync_queue.where('tenantId').equals(tenantId).filter((item) => item.status === 'completed').delete();
  }
}

export const syncRepository = new SyncRepository();

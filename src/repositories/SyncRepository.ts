import type { EMamDatabase } from '@/database/dexie';
import type { Table } from 'dexie';
import type { SyncQueueItem as DomainSyncQueueItem } from '@/types';
import type { SecurityContext } from '@/core/security/types';

export type SyncQueueStatus = 'pending' | 'processing' | 'synced' | 'failed' | 'dead_letter';
export type SyncRepositoryItem = DomainSyncQueueItem;

/** Canonical local outbox repository. Cloud access is intentionally absent. */
export class SyncRepository {
  private readonly table: Table<DomainSyncQueueItem, string>;

  constructor(db: EMamDatabase) {
    this.table = db.table('sync_queue') as Table<DomainSyncQueueItem, string>;
  }

  async getPendingItems(context: SecurityContext, limit = 50): Promise<DomainSyncQueueItem[]> {
    if (!context?.tenantId) return [];
    const now = Date.now();
    const rows = await this.table.where('tenantId').equals(context.tenantId).filter((item) => {
      return item.status === 'pending' && (!item.nextRetryAt || item.nextRetryAt <= now);
    }).toArray();
    return rows.sort((a, b) => a.createdAt - b.createdAt).slice(0, limit);
  }

  async getById(id: string): Promise<DomainSyncQueueItem | undefined> { return this.table.get(id); }

  async claimItem(id: string, tenantId: string): Promise<DomainSyncQueueItem | undefined> {
    const item = await this.table.get(id);
    if (!item || item.tenantId !== tenantId || item.status !== 'pending') return undefined;
    await this.table.update(id, { status: 'processing', updatedAt: Date.now() });
    return this.table.get(id);
  }

  async recoverStaleProcessingItems(tenantId: string, maxAgeMs = 5 * 60_000): Promise<number> {
    const cutoff = Date.now() - maxAgeMs;
    const rows = await this.table.where('tenantId').equals(tenantId).filter((item) => item.status === 'processing' && item.updatedAt < cutoff).toArray();
    if (!rows.length) return 0;
    await this.table.bulkPut(rows.map((item) => ({ ...item, status: 'pending' as const, updatedAt: Date.now(), nextRetryAt: undefined })));
    return rows.length;
  }

  async updateStatus(id: string, status: DomainSyncQueueItem['status'] | 'completed'): Promise<void> {
    await this.table.update(id, { status: status === 'completed' ? 'synced' : status, updatedAt: Date.now() });
  }

  async clearCompleted(tenantId: string): Promise<void> {
    const rows = await this.table.where('tenantId').equals(tenantId).filter((item) => item.status === 'synced').toArray();
    if (rows.length) await this.table.bulkDelete(rows.map((item) => item.id));
  }

  async incrementRetry(id: string): Promise<void> {
    const item = await this.table.get(id);
    if (!item) return;
    await this.table.update(id, { attempts: (item.attempts ?? 0) + 1, status: 'failed', updatedAt: Date.now() });
  }

  async scheduleRetry(id: string, delayMs: number): Promise<void> {
    await this.table.update(id, { status: 'pending', nextRetryAt: Date.now() + Math.max(0, delayMs), updatedAt: Date.now() });
  }

  async moveToDeadLetterQueue(id: string, error: string, code?: string): Promise<void> {
    await this.table.update(id, { status: 'dead_letter', error: code ? `${code}: ${error}` : error, updatedAt: Date.now() });
  }

  async getDeltaCheckpoint(tenantId: string, collection: string): Promise<string | undefined> {
    const key = `delta:${tenantId}:${collection}`;
    const row = await this.table.get(key);
    return row?.metadata?.deltaCursor as string | undefined;
  }

  async saveDeltaCheckpoint(tenantId: string, collection: string, cursor: string): Promise<void> {
    const key = `delta:${tenantId}:${collection}`;
    const existing = await this.table.get(key);
    await this.table.put({
      ...(existing ?? {}), id: key, tenantId, collection: '__sync_checkpoint__', operation: 'update', recordId: key,
      payload: {}, status: 'synced', createdAt: existing?.createdAt ?? Date.now(), updatedAt: Date.now(),
      metadata: { ...(existing?.metadata ?? {}), deltaCursor: cursor },
    } as DomainSyncQueueItem);
  }
}

import type { EMamDatabase } from '@/database/dexie';
import type { Table } from 'dexie';

export type SyncQueueStatus = 'pending' | 'processing' | 'synced' | 'failed' | 'dead_letter';

export interface SyncQueueItem {
  id: string;
  tenantId: string;
  collection: string;
  operation: 'create' | 'update' | 'delete';
  recordId: string;
  payload: unknown;
  status: SyncQueueStatus;
  attempts?: number;
  createdAt: number;
  updatedAt: number;
  nextRetryAt?: number;
  priority?: string;
  metadata?: {
    actorId?: string;
    version?: number;
    idempotencyKey?: string;
    action?: string;
    [key: string]: unknown;
  };
  error?: string;
}

/** Canonical local outbox repository. Cloud access is intentionally absent. */
export class SyncRepository {
  private readonly table: Table<SyncQueueItem, string>;

  constructor(db: EMamDatabase) {
    this.table = db.table('sync_queue') as Table<SyncQueueItem, string>;
  }

  async getPendingItems(tenantId: string, limit = 50): Promise<SyncQueueItem[]> {
    const now = Date.now();
    const rows = await this.table
      .where('tenantId').equals(tenantId)
      .filter(item => item.status === 'pending' && (!item.nextRetryAt || item.nextRetryAt <= now))
      .toArray();
    return rows
      .sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0) || a.createdAt - b.createdAt)
      .slice(0, limit);
  }

  async getById(id: string): Promise<SyncQueueItem | undefined> {
    return this.table.get(id);
  }

  async markProcessing(id: string): Promise<void> {
    await this.table.update(id, { status: 'processing', updatedAt: Date.now() });
  }

  async markSynced(id: string): Promise<void> {
    await this.table.update(id, { status: 'synced', updatedAt: Date.now(), error: undefined });
  }

  async markFailed(id: string, error: string, nextRetryAt?: number): Promise<void> {
    const current = await this.table.get(id);
    if (!current) return;
    const attempts = (current.attempts ?? 0) + 1;
    await this.table.update(id, {
      status: 'failed',
      attempts,
      nextRetryAt,
      error,
      updatedAt: Date.now(),
    });
  }

  async requeue(id: string): Promise<void> {
    await this.table.update(id, { status: 'pending', nextRetryAt: undefined, updatedAt: Date.now() });
  }

  async recoverStaleProcessing(maxAgeMs = 5 * 60_000): Promise<number> {
    const cutoff = Date.now() - maxAgeMs;
    const stale = await this.table
      .where('status').equals('processing')
      .filter(item => item.updatedAt < cutoff)
      .toArray();
    if (!stale.length) return 0;
    await this.table.bulkPut(stale.map(item => ({
      ...item,
      status: 'pending' as const,
      nextRetryAt: undefined,
      updatedAt: Date.now(),
    })));
    return stale.length;
  }
}

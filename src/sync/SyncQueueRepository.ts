import { DatabaseResolver } from '@/database/dexie';

export type SyncQueueStatus = 'pending' | 'processing' | 'synced' | 'failed';
export type SyncQueueOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem<TPayload = unknown> {
  id: string;
  tenantId: string;
  collection: string;
  operation: SyncQueueOperation;
  recordId: string;
  payload: TPayload;
  status: SyncQueueStatus;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  priority?: 'high' | 'normal' | 'low';
  metadata?: {
    actorId?: string;
    version?: number;
    idempotencyKey?: string;
    action?: string;
    [key: string]: unknown;
  };
  lastError?: string;
}

/**
 * Canonical durable application outbox.
 *
 * Operational repositories may enqueue work as part of the same Dexie
 * transaction that commits the domain record. SyncEngine owns processing;
 * this repository owns queue persistence and state transitions.
 */
export class SyncQueueRepository {
  private readonly tableName = 'sync_queue';

  private table() {
    return DatabaseResolver.getDatabase().table<SyncQueueItem, string>(this.tableName);
  }

  async getPending(limit = 50): Promise<SyncQueueItem[]> {
    return this.table()
      .where('status')
      .equals('pending')
      .sortBy('createdAt')
      .then(items => items.slice(0, limit));
  }

  async getById(id: string): Promise<SyncQueueItem | undefined> {
    return this.table().get(id);
  }

  async markProcessing(id: string): Promise<void> {
    const now = Date.now();
    await this.table().update(id, { status: 'processing', updatedAt: now });
  }

  async markSynced(id: string): Promise<void> {
    const now = Date.now();
    await this.table().update(id, { status: 'synced', updatedAt: now, lastError: undefined });
  }

  async markFailed(id: string, error: unknown): Promise<void> {
    const current = await this.table().get(id);
    if (!current) return;
    const now = Date.now();
    await this.table().update(id, {
      status: 'failed',
      attempts: Number(current.attempts ?? 0) + 1,
      updatedAt: now,
      lastError: error instanceof Error ? error.message : String(error),
    });
  }

  async requeue(id: string): Promise<void> {
    await this.table().update(id, { status: 'pending', updatedAt: Date.now() });
  }
}

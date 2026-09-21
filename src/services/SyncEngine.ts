import { syncRepository, type SyncQueueItem } from '@/repositories/SyncRepository';
import { FirestoreSyncDataSource, getNextDeltaCursor } from '@/infrastructure/datasource/SyncDataSource';
import { db } from '@/database/db';
import { TenantContext } from '@/core/context/TenantContext';

const PULL_COLLECTIONS = [
  'students',
  'teachers',
  'classes',
  'attendance',
  'teacher_attendance',
  'points',
  'letters',
  'journals',
  'academic_years',
  'schedules',
  'users',
] as const;

/**
 * Canonical synchronization engine.
 *
 * Write path:
 *   Dexie -> sync_queue -> Firestore gateway
 *
 * Pull path:
 *   Firestore gateway -> delta -> Dexie
 *
 * UI/services never access Firestore directly.
 */
export class SyncEngine {
  private static instance: SyncEngine;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private readonly dataSource = new FirestoreSyncDataSource();

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) SyncEngine.instance = new SyncEngine();
    return SyncEngine.instance;
  }

  static start(intervalMs?: number, tenantId?: string): void {
    void SyncEngine.getInstance().startBackgroundSync(intervalMs, tenantId);
  }

  static stop(): void {
    void SyncEngine.getInstance().stopBackgroundSync();
  }

  async sync(tenantId?: string): Promise<void> {
    if (this.running || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    this.running = true;
    try {
      let item = await syncRepository.nextPending();
      while (item) {
        await this.process(item);
        item = await syncRepository.nextPending();
      }

      const activeTenant = tenantId || this.resolveTenantId();
      if (activeTenant) await this.pullTenant(activeTenant);
    } finally {
      this.running = false;
    }
  }

  private resolveTenantId(): string | undefined {
    try {
      const id = TenantContext.getTenantId();
      return id && id !== 'system' ? id : undefined;
    } catch {
      return undefined;
    }
  }

  private async process(item: SyncQueueItem): Promise<void> {
    await syncRepository.markProcessing(item.id);
    try {
      if (item.operation === 'delete') {
        await this.dataSource.delete(item.collection, item.documentId);
      } else {
        await this.dataSource.push(item.collection, item.documentId, item.payload);
      }
      await syncRepository.markCompleted(item.id);
    } catch (error) {
      const updated = await syncRepository.markFailed(item.id, error);
      if (updated && updated.retryCount >= 5) await syncRepository.moveToDeadLetter(updated);
    }
  }

  /**
   * Pull only changed records and apply them to Dexie without creating a new
   * outbox mutation. Local pending mutations always win until their queue item
   * is completed.
   */
  private async pullTenant(tenantId: string): Promise<void> {
    for (const collection of PULL_COLLECTIONS) {
      let cursor = await this.getCursor(tenantId, collection);
      let page = await this.dataSource.pullDelta(collection, tenantId, cursor);

      while (page.length) {
        await this.applyCloudPage(collection, tenantId, page);

        const nextCursor = getNextDeltaCursor(page, cursor);
        if (!nextCursor || nextCursor === cursor) break;
        cursor = nextCursor;
        await this.saveCursor(tenantId, collection, cursor);

        if (page.length < 200) break;
        page = await this.dataSource.pullDelta(collection, tenantId, cursor);
      }
    }
  }

  private async applyCloudPage(collection: string, tenantId: string, records: any[]): Promise<void> {
    const table = db.table(collection);
    for (const record of records) {
      if (!record?.id || record.tenantId !== tenantId) continue;

      const pending = await db.sync_queue
        .filter((q: any) =>
          q.status !== 'completed' &&
          q.collection === collection &&
          String(q.documentId) === String(record.id),
        )
        .first();

      if (pending) continue;

      const local = await table.get(record.id);
      const cloudVersion = Number(record.version ?? 0);
      const localVersion = Number(local?.version ?? 0);
      const cloudUpdated = new Date(record.updatedAt ?? 0).getTime();
      const localUpdated = new Date(local?.updatedAt ?? 0).getTime();

      if (local && cloudVersion < localVersion) continue;
      if (local && cloudVersion === localVersion && cloudUpdated < localUpdated) continue;

      await table.put({
        ...record,
        tenantId,
        syncStatus: 'synced',
      } as any);
    }
  }

  private async getCursor(tenantId: string, collection: string): Promise<string | undefined> {
    const key = `pull:${tenantId}:${collection}`;
    const metadata = await db.syncMetadata.get(key);
    return metadata?.cursor || undefined;
  }

  private async saveCursor(tenantId: string, collection: string, cursor: string): Promise<void> {
    const key = `pull:${tenantId}:${collection}`;
    await db.syncMetadata.put({
      id: key,
      tenantId,
      collection,
      cursor,
      updatedAt: new Date().toISOString(),
    });
  }

  async startBackgroundSync(intervalMs = 10000, tenantId?: string): Promise<void> {
    if (this.intervalId) return;
    await this.sync(tenantId);
    this.intervalId = setInterval(() => void this.sync(tenantId), intervalMs);
  }

  async stopBackgroundSync(): Promise<void> {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

export const syncEngine = SyncEngine.getInstance();

import { syncQueue } from '@/core/offline/SyncQueue';
import { FirestoreSyncDataSource } from '@/core/offline/FirestoreSyncDataSource';

/**
 * Canonical SyncEngine.
 *
 * Only this service owns the background synchronization loop.
 * Application writes must first reach Dexie/SyncQueue; this engine drains
 * the queue and delegates cloud operations to the sync data source.
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

  static start(intervalMs?: number): void {
    void SyncEngine.getInstance().startBackgroundSync(intervalMs);
  }

  static stop(): void {
    void SyncEngine.getInstance().stopBackgroundSync();
  }

  async sync(): Promise<void> {
    if (this.running || typeof navigator !== 'undefined' && !navigator.onLine) return;
    this.running = true;
    try {
      // The queue remains the operational source of pending writes.
      const pending = await syncQueue.peek?.();
      if (!pending) return;
      await this.dataSource.push(pending);
      await syncQueue.ack?.(pending.id);
    } finally {
      this.running = false;
    }
  }

  async startBackgroundSync(intervalMs = 10000): Promise<void> {
    if (this.intervalId) return;
    await this.sync();
    this.intervalId = setInterval(() => void this.sync(), intervalMs);
  }

  async stopBackgroundSync(): Promise<void> {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

export const syncEngine = SyncEngine.getInstance();

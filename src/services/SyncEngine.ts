import { syncRepository, type SyncQueueItem } from '@/repositories/SyncRepository';
import { FirestoreSyncDataSource } from '@/infrastructure/datasource/SyncDataSource';

/** Canonical synchronization engine: Dexie SyncQueue -> Firestore gateway. */
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
    if (this.running || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    this.running = true;
    try {
      let item = await syncRepository.nextPending();
      while (item) {
        await this.process(item);
        item = await syncRepository.nextPending();
      }
    } finally {
      this.running = false;
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

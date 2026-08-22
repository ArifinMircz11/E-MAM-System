import { localDb } from '@/database/dexie';
import { SyncDispatcher } from './SyncDispatcher';
import type { ISyncOperation } from './types';
import { SecurityContext } from '@/core/security/SecurityContext';
import { getSecurityContext } from '@/core/security/contextHelper';
import { authGateway } from '@/services/auth/AuthGateway';
import { syncRepository } from '@/repositories/SyncRepository';

export class SyncWorker {
  private static isSyncing = false;
  private static readonly MAX_RETRY = 5;

  static async processQueue(context?: SecurityContext) {
    if (this.isSyncing) return { synced: 0 };
    if (!navigator.onLine) return { synced: 0 };

    const syncContext = context || getSecurityContext(false);

    if (!syncContext || (!authGateway.getCurrentUser() && !(syncContext as any).isAuthenticated)) {
      console.log('[SyncWorker] SecurityContext tidak tersedia atau tidak terautentikasi, membatalkan sync (FAIL CLOSED)');
      return { synced: 0 };
    }

    this.isSyncing = true;
    let count = 0;

    try {
      const queue = await localDb.sync_queue
        .where('status')
        .anyOf(['pending', 'waiting', 'failed', 'processing'])
        .toArray();

      const operations = queue as ISyncOperation[];
      operations.sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0));

      for (const op of operations) {
        const retryCount = op.retryCount || 0;
        
        if (retryCount > 0 && op.lastRetry) {
          const backoff = Math.min(1000 * Math.pow(2, retryCount), 1000 * 60 * 60);
          if (Date.now() - Number(op.lastRetry) < backoff) {
            continue;
          }
        }

        if (retryCount >= this.MAX_RETRY) {
          await this.moveToDeadLetterQueue(op, 'Max retries exceeded');
          continue;
        }

        try {
          await SyncDispatcher.dispatch(op, syncContext);
          
          await localDb.sync_queue.update(op.id, {
            status: 'completed',
            updatedAt: Date.now(),
          });
          count++;

          if (op.collection === 'journals' || op.payload?.collection === 'journals') {
            const { JournalCacheService } = await import('@/services/journalCacheService');
            if (syncContext.tenantId) await JournalCacheService.invalidateCache(syncContext.tenantId);
          }

        } catch (err: any) {
          const errMsg = err?.message || String(err);
          
          if (errMsg.includes('resource-exhausted') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            (window as any).__FIRESTORE_QUOTA_EXCEEDED = true;
            console.warn('[SyncWorker] Firestore quota exceeded. Pausing cloud sync; local Dexie queue is preserved.');
            try {
              const { SyncEngine } = await import('@/services/SyncEngine');
              SyncEngine.stop();
            } catch (e) {
              console.warn('[SyncWorker] Failed to pause SyncEngine:', e);
            }
            break;
          }

          console.error(`[SyncWorker] Error processing op ${op.id} (${op.collection}):`, err);
          
          const newRetryCount = retryCount + 1;
          if (newRetryCount >= this.MAX_RETRY) {
            await this.moveToDeadLetterQueue(op, `Sync failed (${errMsg})`);
          } else {
            await localDb.sync_queue.update(op.id, {
              retryCount: newRetryCount,
              lastRetry: Date.now(),
              errorLog: errMsg,
              status: 'failed'
            });
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced: count };
  }

  private static async moveToDeadLetterQueue(op: ISyncOperation, reason: string) {
    console.warn(`[SyncWorker] Moving op ${op.id} to DLQ. Reason: ${reason}`);
    try {
      await syncRepository.moveToDeadLetterQueue(
        op.id,
        reason,
        'SYNC_WORKER_MAX_RETRIES_EXCEEDED',
      );
    } catch (e) {
      console.error(`[SyncWorker] Failed to move op ${op.id} to DLQ`, e);
    }
  }
}

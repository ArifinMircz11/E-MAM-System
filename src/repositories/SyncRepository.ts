import { localDb } from '@/database/dexie';

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SyncQueueItem {
  id: string;
  tenantId: string;
  collection: string;
  documentId: string;
  operation: SyncOperation;
  payload: unknown;
  version: number;
  status: SyncStatus;
  retryCount: number;
  deviceId: string;
  createdAt: string;
  processedAt: string | null;
  lastRetryAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

const queue = () => localDb.table<SyncQueueItem, string>('sync_queue');
const deadLetterQueue = () => localDb.table<SyncQueueItem, string>('dead_letter_queue');

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const now = (): string => new Date().toISOString();

export const syncRepository = {
  async enqueue(
    item: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount' | 'processedAt' | 'lastRetryAt' | 'errorCode' | 'errorMessage'> &
      Partial<Pick<SyncQueueItem, 'id' | 'status' | 'retryCount' | 'processedAt' | 'lastRetryAt' | 'errorCode' | 'errorMessage'>>,
  ): Promise<string> {
    if (!item.tenantId || !item.collection || !item.documentId) {
      throw new Error('SYNC_QUEUE_INVALID_IDENTITY');
    }

    const record: SyncQueueItem = {
      ...item,
      id: item.id ?? createId(),
      status: item.status ?? 'pending',
      retryCount: item.retryCount ?? 0,
      processedAt: item.processedAt ?? null,
      lastRetryAt: item.lastRetryAt ?? null,
      errorCode: item.errorCode ?? null,
      errorMessage: item.errorMessage ?? null,
    };

    await queue().put(record);
    return record.id;
  },

  async getPending(limit = 50): Promise<SyncQueueItem[]> {
    const records = await queue()
      .where('status')
      .anyOf(['pending', 'failed'])
      .toArray();

    return records
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, Math.max(1, limit));
  },

  async getPendingCount(): Promise<number> {
    return queue().where('status').anyOf(['pending', 'failed']).count();
  },

  async markProcessing(id: string): Promise<void> {
    await queue().update(id, {
      status: 'processing',
      lastRetryAt: now(),
    });
  },

  async markCompleted(id: string): Promise<void> {
    await queue().update(id, {
      status: 'completed',
      processedAt: now(),
      errorCode: null,
      errorMessage: null,
    });
  },

  async markFailed(id: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    const current = await queue().get(id);

    await queue().update(id, {
      status: 'failed',
      retryCount: (current?.retryCount ?? 0) + 1,
      lastRetryAt: now(),
      errorCode: 'SYNC_PROCESSING_FAILED',
      errorMessage: message,
    });
  },

  async moveToDeadLetter(id: string): Promise<void> {
    const item = await queue().get(id);
    if (!item) return;

    await localDb.transaction('rw', queue(), deadLetterQueue(), async () => {
      await deadLetterQueue().put({ ...item, status: 'failed', processedAt: now() });
      await queue().delete(id);
    });
  },

  async clearCompleted(): Promise<void> {
    await queue().where('status').equals('completed').delete();
  },
};

export { syncRepository as SyncRepository };

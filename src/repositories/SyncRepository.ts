import { db } from '@/database/db';

type SyncOperation = 'create' | 'update' | 'delete';
export interface SyncQueueItem {
  id: string;
  tenantId: string;
  collection: string;
  documentId: string;
  operation: SyncOperation;
  payload: unknown;
  version: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  deviceId: string;
  createdAt: string;
  processedAt: string | null;
  lastRetryAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getDeviceId = (): string => {
  if (typeof localStorage === 'undefined') return 'server';
  const key = 'emam:device-id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = createId();
  localStorage.setItem(key, id);
  return id;
};

export class SyncRepository {
  async enqueue(input: {
    tenantId?: string;
    collection: string;
    operation: SyncOperation;
    recordId?: string;
    payload: any;
    version?: number;
  }): Promise<SyncQueueItem> {
    const now = new Date().toISOString();
    const item: SyncQueueItem = {
      id: createId(),
      tenantId: String(input.tenantId || input.payload?.tenantId || ''),
      collection: input.collection,
      documentId: String(input.recordId || input.payload?.id || input.payload?.uid || ''),
      operation: input.operation,
      payload: input.payload,
      version: Number(input.version ?? input.payload?.version ?? 1),
      status: 'pending',
      retryCount: 0,
      deviceId: getDeviceId(),
      createdAt: now,
      processedAt: null,
      lastRetryAt: null,
      errorCode: null,
      errorMessage: null,
    };
    if (!item.tenantId || !item.documentId) throw new Error('SyncQueue requires tenantId and documentId');
    await db.sync_queue.put(item);
    return item;
  }

  async nextPending(): Promise<SyncQueueItem | undefined> {
    return db.sync_queue
      .where('status')
      .equals('pending')
      .sortBy('createdAt')
      .then((items) => items[0]);
  }

  async markProcessing(id: string): Promise<void> {
    await db.sync_queue.update(id, { status: 'processing' });
  }

  async markCompleted(id: string): Promise<void> {
    await db.sync_queue.update(id, {
      status: 'completed',
      processedAt: new Date().toISOString(),
      errorCode: null,
      errorMessage: null,
    });
  }

  async markFailed(id: string, error: unknown): Promise<SyncQueueItem | undefined> {
    const current = await db.sync_queue.get(id);
    if (!current) return undefined;
    const retryCount = Number(current.retryCount || 0) + 1;
    const message = error instanceof Error ? error.message : String(error);
    const errorCode = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : null;
    await db.sync_queue.update(id, {
      status: retryCount >= 5 ? 'failed' : 'pending',
      retryCount,
      lastRetryAt: new Date().toISOString(),
      errorCode,
      errorMessage: message,
    });
    return db.sync_queue.get(id);
  }

  async moveToDeadLetter(item: SyncQueueItem): Promise<void> {
    await db.transaction('rw', db.sync_queue, db.dead_letter_queue, async () => {
      await db.dead_letter_queue.put({ ...item, status: 'failed', movedAt: new Date().toISOString() });
      await db.sync_queue.delete(item.id);
    });
  }

  async getSyncMetadata(tenantId: string = 'tenant-demo') {
    try {
      return await db.syncMetadata.where('tenantId').equals(tenantId).first();
    } catch {
      return null;
    }
  }

  async saveSyncMetadata(metadata: any) {
    try {
      await db.syncMetadata.put(metadata);
    } catch {}
  }
}

export const syncRepository = new SyncRepository();

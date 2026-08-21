/**
 * e-MAM System — Canonical Sync Queue Contract
 *
 * Canonical vocabulary for the Dexie outbox / SyncEngine boundary.
 * Legacy vocabulary must be normalized before entering this contract.
 */

export type SyncOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'patch'
  | 'bulk_create'
  | 'bulk_update';

export type SyncQueueStatus =
  | 'pending'
  | 'processing'
  | 'waiting'
  | 'completed'
  | 'success'
  | 'failed';

export interface SyncQueueItem {
  id: string;
  tenantId: string;
  operation: SyncOperation;
  collection: string;
  recordId?: string;
  payload: unknown;
  status: SyncQueueStatus;
  attempts: number;
  createdAt: number;
  updatedAt?: number;
  nextRetryAt?: string;
  lastError?: string;
  metadata?: {
    actorId?: string;
    idempotencyKey?: string;
    version?: number;
    action?: string;
  };
}

export interface DeadLetterQueueItem {
  id: string;
  tenantId: string;
  tenantsId?: string;
  collection: string;
  entityId?: string;
  operation: SyncOperation;
  payload: unknown;
  version: number;
  errorCode: string;
  errorReason: string;
  createdBy: string;
  updatedBy?: string;
  status: 'dead_letter';
  retryCount: number;
  createdAt: number;
  failedAt: number;
}

export interface LegacySyncQueueItem {
  id: string;
  tenantId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PATCH' | 'BULK_CREATE' | 'BULK_UPDATE' | string;
  collection?: string;
  entityId?: string;
  entityType?: string;
  documentId?: string;
  payload?: unknown;
  status?: string;
  retryCount?: number;
  error?: string;
  createdAt?: number;
  updatedAt?: number;
}

export function normalizeSyncOperation(
  action: LegacySyncQueueItem['action'],
): SyncOperation {
  const normalized = action.toLowerCase();
  if (
    normalized === 'create' ||
    normalized === 'update' ||
    normalized === 'delete' ||
    normalized === 'patch' ||
    normalized === 'bulk_create' ||
    normalized === 'bulk_update'
  ) {
    return normalized;
  }

  throw new Error(`Unsupported sync operation: ${action}`);
}

export function normalizeSyncQueueItem(
  legacy: LegacySyncQueueItem,
): SyncQueueItem {
  const operation = normalizeSyncOperation(legacy.action);
  const recordId = legacy.entityId ?? legacy.documentId;

  return {
    id: legacy.id,
    tenantId: legacy.tenantId,
    operation,
    collection: legacy.collection ?? legacy.entityType ?? '',
    recordId,
    payload: legacy.payload ?? null,
    status:
      legacy.status === 'processing' ||
      legacy.status === 'waiting' ||
      legacy.status === 'completed' ||
      legacy.status === 'success' ||
      legacy.status === 'failed'
        ? legacy.status
        : 'pending',
    attempts: legacy.retryCount ?? 0,
    createdAt: legacy.createdAt ?? Date.now(),
    updatedAt: legacy.updatedAt,
    lastError: legacy.error,
  };
}

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
  | 'completed'
  | 'success'
  | 'failed';

export interface SyncQueueItem {
  /** Stable queue item identifier. */
  id: string;
  /** Tenant isolation boundary. */
  tenantId: string;
  /** Canonical mutation operation. */
  operation: SyncOperation;
  /** Canonical collection name. */
  collection: string;
  /** Canonical target record identifier. */
  recordId?: string;
  /** Mutation payload captured at the Dexie transaction boundary. */
  payload: unknown;
  /** Current outbox processing state. */
  status: SyncQueueStatus;
  /** Number of failed processing attempts. */
  attempts: number;
  /** Creation timestamp in epoch milliseconds. */
  createdAt: number;
  /** Last queue state update timestamp in epoch milliseconds. */
  updatedAt?: number;
  /** Earliest retry time, represented as an ISO timestamp. */
  nextRetryAt?: string;
  /** Last normalized error message. */
  lastError?: string;
  /** Non-contractual operational metadata. */
  metadata?: {
    actorId?: string;
    idempotencyKey?: string;
    version?: number;
  };
}

/**
 * Legacy queue records are accepted only at migration/normalization boundaries.
 * They must not be used as the canonical SyncEngine contract.
 */
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

/** Converts legacy queue vocabulary to the canonical contract. */
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

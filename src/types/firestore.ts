// src/types/firestore.ts

/**
 * Common metadata injected into all Firestore documents in e-Mam System.
 */
export interface FirestoreAuditMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  tenantId: string;
}

/**
 * Represents a Firestore Document containing data with its unique ID.
 */
export type WithId<T> = T & {
  id: string;
};

/**
 * @deprecated Offline staging belongs to the local outbox/sync boundary,
 * not to the Firestore document contract. Prefer SyncQueueItem from
 * `@/types/syncQueue` for new code.
 *
 * Retained temporarily for compatibility with legacy consumers.
 */
export interface OfflineStagedItem<T> {
  id: string;
  collectionName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: T;
  timestamp: string;
  status: 'pending' | 'processing' | 'failed';
  retryCount: number;
}

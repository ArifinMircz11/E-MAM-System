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
 * Structure mapping of central collections for offline queue and staging storage.
 */
export interface OfflineStagedItem<T> {
  id: string; // Staged item UUID
  collectionName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: T;
  timestamp: string;
  status: 'pending' | 'processing' | 'failed';
  retryCount: number;
}

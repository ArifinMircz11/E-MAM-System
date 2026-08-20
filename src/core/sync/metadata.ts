// Sync Metadata for delta syncs and versioning
export interface SyncMetadata {
  collection: string;
  lastSyncedAt: number;
  version: number;
  tenantId: string;
}

export const SyncManager = {
  // Logic to manage sync metadata
};

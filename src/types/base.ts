export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: number;
  updatedAt: number;
  lastSyncAt?: number;
  syncStatus: 'synced' | 'pending' | 'error';
  deleted?: boolean;
  version?: number;
}

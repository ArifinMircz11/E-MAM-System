import { SyncStatus } from '../domain/entities/base';

export interface BaseEntity {
    id?: string;
    tenantId?: string;
    createdAt?: number;
    updatedAt?: number;
    lastSyncAt?: number;
    syncStatus?: SyncStatus | "synced" | "pending" | "error" | "local_only";
    deleted?: boolean;
    version?: number;
}

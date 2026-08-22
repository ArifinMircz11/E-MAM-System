import { SyncStatus } from '../domain/entities/base';

/**
 * Repository-level persistence contract.
 *
 * Every entity handled by a tenant-scoped repository must carry a concrete
 * tenantId. Optional tenantId here caused strict-null errors at the
 * repository -> SyncRepository boundary and weakened tenant isolation.
 */
export interface BaseEntity {
    id?: string;
    tenantId: string;
    createdAt?: number;
    updatedAt?: number;
    lastSyncAt?: number;
    syncStatus?: SyncStatus | "synced" | "pending" | "error" | "local_only";
    deleted?: boolean;
    version?: number;
}

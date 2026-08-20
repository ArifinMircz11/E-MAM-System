import { BaseEntity } from "@/types/base";

export interface SyncService {
  push<T extends BaseEntity>(collection: string, entity: T): Promise<void>;
  pull<T extends BaseEntity>(collection: string, tenantId: string, lastSyncAt: number): Promise<T[]>;
}

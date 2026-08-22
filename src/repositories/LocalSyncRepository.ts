import { localDb } from '@/database/dexie';
import { SyncStatus } from '@/domain/entities/base';

/**
 * Repository boundary for records materialized by SyncEngine after a remote pull.
 * SyncEngine owns transport/orchestration; this repository owns the Dexie write.
 */
export class LocalSyncRepository {
  async upsertSyncedRecord(
    collection: string,
    record: Record<string, unknown>,
    idField = 'id',
    tenantId?: string,
  ): Promise<boolean> {
    const rawId = record[idField] ?? record.id;
    if (!rawId) return false;

    const table = (localDb as unknown as Record<string, { put?: (value: unknown) => Promise<unknown> }>)[collection];
    if (!table?.put) {
      throw new Error(`SYNC_LOCAL_TABLE_NOT_FOUND: ${collection}`);
    }

    await table.put({
      ...record,
      id: String(rawId),
      ...(tenantId ? { tenantId } : {}),
      syncStatus: SyncStatus.SYNCED,
    });
    return true;
  }

  async markRecordSynced(collection: string, recordId: string): Promise<number> {
    if (!collection || !recordId) return 0;
    const table = (localDb as unknown as Record<string, { update?: (key: string, changes: Record<string, unknown>) => Promise<number> }>)[collection];
    if (!table?.update) return 0;
    return table.update(String(recordId), { syncStatus: SyncStatus.SYNCED });
  }
}

export const localSyncRepository = new LocalSyncRepository();

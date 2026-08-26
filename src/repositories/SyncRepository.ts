import { db } from '@/database/db';

export class SyncRepository {
  async getSyncMetadata(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('syncMetadata')) {
        return await db.table('syncMetadata').where('tenantId').equals(tenantId).first();
      }
      return null;
    } catch {
      return null;
    }
  }

  async saveSyncMetadata(metadata: any) {
    try {
      if (db.table('syncMetadata')) {
        await db.table('syncMetadata').put(metadata);
      }
    } catch {}
  }
}

export const syncRepository = new SyncRepository();

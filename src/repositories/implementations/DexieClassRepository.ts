import { db } from '@/database/db';

export class DexieClassRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('classes')) {
        return await db.table('classes').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(item: any) {
    try {
      if (db.table('classes')) {
        await db.table('classes').put(item);
      }
    } catch {}
  }
}

export const dexieClassRepository = new DexieClassRepository();

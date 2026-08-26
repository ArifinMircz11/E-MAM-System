import { db } from '@/database/db';

export class GenericCollectionService {
  static async getAll(tableName: string, tenantId: string = 'tenant-demo') {
    try {
      if (db.table(tableName)) {
        return await db.table(tableName).where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  static async getById(tableName: string, id: string) {
    try {
      if (db.table(tableName)) {
        return await db.table(tableName).get(id);
      }
      return null;
    } catch {
      return null;
    }
  }

  static async save(tableName: string, entity: any) {
    try {
      if (db.table(tableName)) {
        return await db.table(tableName).put(entity);
      }
    } catch {}
    return null;
  }
}

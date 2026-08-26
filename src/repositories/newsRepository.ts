import { db } from '@/database/db';

export class NewsRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('news')) {
        return await db.table('news').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(item: any) {
    try {
      if (db.table('news')) {
        await db.table('news').put(item);
      }
    } catch {}
  }
}

export const newsRepository = new NewsRepository();

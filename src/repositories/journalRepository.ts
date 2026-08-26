import { db } from '@/database/db';

export class JournalRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('journals')) {
        return await db.table('journals').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(journal: any) {
    try {
      if (db.table('journals')) {
        await db.table('journals').put(journal);
      }
    } catch {}
  }
}

export const journalRepository = new JournalRepository();

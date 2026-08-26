import { db } from '@/database/db';

export class DexieTemplateRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('templates')) {
        return await db.table('templates').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(item: any) {
    try {
      if (db.table('templates')) {
        await db.table('templates').put(item);
      }
    } catch {}
  }
}

export const dexieTemplateRepository = new DexieTemplateRepository();
export const templateRepository = dexieTemplateRepository;

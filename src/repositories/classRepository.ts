import { db } from '@/database/db';
import { ClassItem } from '@/types';

export class ClassRepository {
  async getAll(tenantId: string = 'tenant-demo'): Promise<ClassItem[]> {
    try {
      if (db.table('classes')) {
        return await db.table('classes').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<ClassItem | null> {
    try {
      if (db.table('classes')) {
        return (await db.table('classes').get(id)) || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async save(cls: ClassItem): Promise<void> {
    try {
      if (db.table('classes')) {
        await db.table('classes').put(cls);
      }
    } catch {}
  }
}

export const classRepository = new ClassRepository();

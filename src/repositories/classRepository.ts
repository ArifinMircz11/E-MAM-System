import { db } from '@/database/db';
import { ClassItem } from '@/types';

export class ClassRepository {
  async getAll(tenantId: string = 'tenant-demo'): Promise<ClassItem[]> {
    return db.table('classes').where('tenantId').equals(tenantId).filter((c: any) => c.deleted !== true).toArray();
  }

  async getById(id: string): Promise<ClassItem | null> {
    return (await db.table('classes').get(id)) || null;
  }

  async save(cls: ClassItem): Promise<void> {
    await db.table('classes').put(cls);
  }

  async delete(id: string): Promise<void> {
    await db.table('classes').delete(id);
  }
}

export const classRepository = new ClassRepository();

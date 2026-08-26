import { db } from '@/database/db';
import { Teacher } from '@/types';

export class TeacherRepository {
  async getAll(tenantId: string = 'tenant-demo'): Promise<Teacher[]> {
    try {
      if (db.table('teachers')) {
        return await db.table('teachers').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<Teacher | null> {
    try {
      if (db.table('teachers')) {
        return (await db.table('teachers').get(id)) || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async save(teacher: Teacher): Promise<void> {
    try {
      if (db.table('teachers')) {
        await db.table('teachers').put(teacher);
      }
    } catch {}
  }

  async update(id: string, updates: Partial<Teacher>): Promise<void> {
    try {
      if (db.table('teachers')) {
        await db.table('teachers').update(id, updates);
      }
    } catch {}
  }

  async delete(id: string): Promise<void> {
    try {
      if (db.table('teachers')) {
        await db.table('teachers').delete(id);
      }
    } catch {}
  }
}

export const teacherRepository = new TeacherRepository();

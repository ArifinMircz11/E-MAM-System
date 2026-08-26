import { db } from '@/database/db';

export class SemesterRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('semesters')) {
        return await db.table('semesters').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(sem: any) {
    try {
      if (db.table('semesters')) {
        await db.table('semesters').put(sem);
      }
    } catch {}
  }
}

export const semesterRepository = new SemesterRepository();

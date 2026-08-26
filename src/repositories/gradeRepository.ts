import { db } from '@/database/db';

export class GradeRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('penilaian')) {
        return await db.table('penilaian').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(grade: any) {
    try {
      if (db.table('penilaian')) {
        await db.table('penilaian').put(grade);
      }
    } catch {}
  }
}

export const gradeRepository = new GradeRepository();

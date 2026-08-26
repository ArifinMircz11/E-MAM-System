import { db } from '@/database/db';

export class PointSummaryRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('student_point_summaries')) {
        return await db.table('student_point_summaries').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(summary: any) {
    try {
      if (db.table('student_point_summaries')) {
        await db.table('student_point_summaries').put(summary);
      }
    } catch {}
  }
}

export const pointSummaryRepository = new PointSummaryRepository();

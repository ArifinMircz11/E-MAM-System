import { db } from '@/database/db';

export class SubmissionRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('submissions')) {
        return await db.table('submissions').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(sub: any) {
    try {
      if (db.table('submissions')) {
        await db.table('submissions').put(sub);
      }
    } catch {}
  }
}

export const submissionRepository = new SubmissionRepository();

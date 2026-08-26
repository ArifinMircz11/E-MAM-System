import { db } from '@/database/db';

export class ComplaintRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('complaints')) {
        return await db.table('complaints').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(complaint: any) {
    try {
      if (db.table('complaints')) {
        await db.table('complaints').put(complaint);
      }
    } catch {}
  }
}

export const complaintRepository = new ComplaintRepository();

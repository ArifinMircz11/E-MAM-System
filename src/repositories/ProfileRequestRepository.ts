import { db } from '@/database/db';

export class ProfileRequestRepository {
  async getByUserId(userId: string, tenantId: string = 'tenant-demo') {
    try {
      if (db.table('profile_update_requests')) {
        return await db.table('profile_update_requests').where('tenantId').equals(tenantId).filter(p => p.userId === userId).first();
      }
      return null;
    } catch {
      return null;
    }
  }

  async save(req: any) {
    try {
      if (db.table('profile_update_requests')) {
        await db.table('profile_update_requests').put(req);
      }
    } catch {}
  }
}

export const profileRequestRepository = new ProfileRequestRepository();

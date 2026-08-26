import { db } from '@/database/db';

export class SystemRepository {
  async getSetting(key: string): Promise<any> {
    try {
      if (db.table('systemSettings')) {
        const item = await db.table('systemSettings').get(key);
        return item ? item.value : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async setSetting(key: string, value: any, tenantId: string = 'tenant-demo'): Promise<void> {
    try {
      if (db.table('systemSettings')) {
        await db.table('systemSettings').put({ id: key, key, value, tenantId, updatedAt: Date.now() });
      }
    } catch {}
  }
}

export const systemRepository = new SystemRepository();

import { db } from '@/database/db';

export class EventRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('events')) {
        return await db.table('events').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(event: any) {
    try {
      if (db.table('events')) {
        await db.table('events').put(event);
      }
    } catch {}
  }
}

export const eventRepository = new EventRepository();

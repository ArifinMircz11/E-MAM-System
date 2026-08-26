import { db } from '@/database/db';

export class ScheduleRepository {
  async getAll(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('schedules')) {
        return await db.table('schedules').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(sched: any) {
    try {
      if (db.table('schedules')) {
        await db.table('schedules').put(sched);
      }
    } catch {}
  }
}

export const scheduleRepository = new ScheduleRepository();

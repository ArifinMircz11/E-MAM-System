import { db } from '@/database/db';
import { ScheduleItem } from '@/types';

export const getSchedules = async (tenantId: string = 'tenant-demo'): Promise<ScheduleItem[]> => {
  try {
    if (db.table('schedules')) {
      return await db.table('schedules').where('tenantId').equals(tenantId).toArray();
    }
    return [];
  } catch {
    return [];
  }
};

export const saveScheduleItemWithBatch = async (
  schedules: ScheduleItem[],
  tenantId: string = 'tenant-demo'
): Promise<boolean> => {
  try {
    if (db.table('schedules')) {
      for (const s of schedules) {
        await db.table('schedules').put({ ...s, tenantId, updatedAt: Date.now() });
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const scheduleService = {
  getSchedules,
  saveScheduleItemWithBatch,
};

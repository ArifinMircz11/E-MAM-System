import { db } from '@/database/db';
import { PointRecord } from '@/types';

export class PointRepository {
  async getAll(tenantId: string = 'tenant-demo'): Promise<PointRecord[]> {
    try {
      if (db.table('points')) {
        return await db.table('points').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async getByStudent(studentId: string, tenantId: string = 'tenant-demo'): Promise<PointRecord[]> {
    try {
      if (db.table('points')) {
        return await db.table('points').where('tenantId').equals(tenantId).filter(p => p.studentId === studentId || (p as any).studentsId === studentId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(record: PointRecord): Promise<void> {
    try {
      if (db.table('points')) {
        await db.table('points').put(record);
      }
    } catch {}
  }
}

export const pointRepository = new PointRepository();

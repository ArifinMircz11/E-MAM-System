import { db } from '@/database/db';
import { AttendanceRecord } from '@/types';

export class AttendanceRepository {
  async getAll(tenantId: string = 'tenant-demo'): Promise<AttendanceRecord[]> {
    try {
      if (db.table('attendance')) {
        return await db.table('attendance').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async getByDate(date: string, tenantId: string = 'tenant-demo'): Promise<AttendanceRecord[]> {
    try {
      if (db.table('attendance')) {
        return await db.table('attendance').where('tenantId').equals(tenantId).filter(a => a.date === date).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async getByStudent(studentId: string, tenantId: string = 'tenant-demo'): Promise<AttendanceRecord[]> {
    try {
      if (db.table('attendance')) {
        return await db.table('attendance').where('tenantId').equals(tenantId).filter(a => a.studentId === studentId || (a as any).studentsId === studentId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(record: AttendanceRecord): Promise<void> {
    try {
      if (db.table('attendance')) {
        await db.table('attendance').put(record);
      }
    } catch {}
  }
}

export const attendanceRepository = new AttendanceRepository();

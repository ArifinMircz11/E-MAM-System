import { db } from '@/database/db';

export class TeacherAttendanceRepository {
  async getByTenant(tenantId: string = 'tenant-demo') {
    try {
      if (db.table('teacher_attendance')) {
        return await db.table('teacher_attendance').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  }

  async save(item: any) {
    try {
      if (db.table('teacher_attendance')) {
        await db.table('teacher_attendance').put(item);
      }
    } catch {}
  }
}

export const teacherAttendanceRepository = new TeacherAttendanceRepository();

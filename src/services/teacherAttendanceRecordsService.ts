import { db } from '@/database/db';

export const getTeacherAttendanceRecords = async (tenantId: string = 'tenant-demo', date?: string) => {
  try {
    if (db.table('teacher_attendance')) {
      return await db.table('teacher_attendance').where('tenantId').equals(tenantId).toArray();
    }
    return [];
  } catch {
    return [];
  }
};

export const saveTeacherAttendanceRecord = async (record: any, tenantId: string = 'tenant-demo') => {
  try {
    if (db.table('teacher_attendance')) {
      const id = record.id || `ta_${Date.now()}`;
      await db.table('teacher_attendance').put({
        ...record,
        id,
        tenantId,
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const deleteTeacherAttendanceRecord = async (id: string): Promise<boolean> => {
  try {
    if (db.table('teacher_attendance')) {
      await db.table('teacher_attendance').delete(id);
      return true;
    }
  } catch {}
  return true;
};

export const getTeacherAttendanceClasses = async (tenantId: string = 'tenant-demo'): Promise<any[]> => {
  try {
    if (db.table('classes')) {
      return await db.table('classes').toArray();
    }
  } catch {}
  return [];
};

export const teacherAttendanceRecordsService = {
  getTeacherAttendanceRecords,
  saveTeacherAttendanceRecord,
  deleteTeacherAttendanceRecord,
  getTeacherAttendanceClasses,
};

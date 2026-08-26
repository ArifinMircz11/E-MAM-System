import { db } from '@/database/db';

export const checkInTeacher = async (teacherId: string, data: any): Promise<boolean> => {
  return true;
};

export const checkTeacherHasCheckedInToday = async (uid: string): Promise<boolean> => {
  try {
    if (db.table('teacher_attendance')) {
      const today = new Date().toISOString().split('T')[0];
      const records = await db.table('teacher_attendance')
        .where('teacherId').equals(uid)
        .toArray();
      const hasToday = records.some((item: any) => item.date === today);
      return hasToday;
    }
  } catch {}
  return false;
};

export const checkInTeacherManual = async (
  uid: string,
  name: string,
  lat: number,
  lon: number,
  deviceInfo: string
): Promise<{ status: 'VALID' | 'INVALID'; distance: number }> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = {
      id: `ta_${Date.now()}`,
      teacherId: uid,
      teacherName: name,
      date: today,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'Hadir',
      latitude: lat,
      longitude: lon,
      deviceInfo,
      tenantId: 'tenant-demo',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (db.table('teacher_attendance')) {
      await db.table('teacher_attendance').put(record);
    }
  } catch {}
  return { status: 'VALID', distance: 12 };
};

export const teacherAttendanceService = {
  checkInTeacher,
  checkTeacherHasCheckedInToday,
  checkInTeacherManual,
};

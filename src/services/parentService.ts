import { db } from '@/database/db';

export const getStudentData = async (studentId: string): Promise<any> => {
  try {
    if (db.table('students')) {
      return await db.table('students').get(studentId);
    }
  } catch {}
  return null;
};

export const parentService = {
  getStudentForParent: async (parentUid: string) => null,
  linkStudent: async (parentUid: string, studentId: string) => ({ success: true }),
  getStudentData,
};

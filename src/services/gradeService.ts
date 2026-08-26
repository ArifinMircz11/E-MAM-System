import { db } from '@/database/db';
import { StudentGrade } from '@/types';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  tenantId?: string;
}

export const getSubjects = async (tenantId: string = 'tenant-demo'): Promise<Subject[]> => {
  try {
    if (db.table('subjects')) {
      return await db.table('subjects').where('tenantId').equals(tenantId).toArray();
    }
    return [
      { id: 'sub-1', name: 'Matematika' },
      { id: 'sub-2', name: 'Bahasa Indonesia' },
      { id: 'sub-3', name: 'Bahasa Arab' },
      { id: 'sub-4', name: 'Fiqih' },
      { id: 'sub-5', name: 'Al-Quran Hadis' },
    ];
  } catch {
    return [];
  }
};

export const getGradesBySubject = async (
  subjectId: string,
  classId?: string,
  tenantId: string = 'tenant-demo'
): Promise<StudentGrade[]> => {
  try {
    if (db.table('penilaian')) {
      return await db.table('penilaian').where('tenantId').equals(tenantId).filter(g => g.subjectId === subjectId).toArray();
    }
    return [];
  } catch {
    return [];
  }
};

export const getGradesByStudent = async (
  studentId: string,
  tenantId: string = 'tenant-demo'
): Promise<StudentGrade[]> => {
  try {
    if (db.table('penilaian')) {
      return await db.table('penilaian').where('tenantId').equals(tenantId).filter(g => g.studentId === studentId).toArray();
    }
    return [];
  } catch {
    return [];
  }
};

export const saveStudentGrade = async (grade: Partial<StudentGrade>): Promise<boolean> => {
  try {
    if (db.table('penilaian')) {
      await db.table('penilaian').put({
        ...grade,
        id: grade.id || `grade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        updatedAt: Date.now(),
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const gradeService = {
  getSubjects,
  getGradesBySubject,
  getGradesByStudent,
  saveStudentGrade,
};

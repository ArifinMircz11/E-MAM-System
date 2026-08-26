import { db } from '@/database/db';
import { Student } from '@/types';
import { MOCK_STUDENTS } from './mockData';

export const getStudents = async (tenantId: string = 'tenant-demo'): Promise<Student[]> => {
  try {
    if (!db.table('students')) return MOCK_STUDENTS;
    const list = await db.table('students').where('tenantId').equals(tenantId).toArray();
    return list.length > 0 ? list : MOCK_STUDENTS;
  } catch {
    return MOCK_STUDENTS;
  }
};

export const getStudentData = getStudents;

export const getStudentsByClass = async (classId: string, tenantId: string = 'tenant-demo') => {
  try {
    if (db.table('students')) {
      return await db.table('students').where('tenantId').equals(tenantId).filter(s => s.classId === classId).toArray();
    }
    return [];
  } catch {
    return [];
  }
};


export const getStudentByUserId = async (userId: string): Promise<Student | null> => {
  try {
    if (!db.table('students')) return MOCK_STUDENTS[0] || null;
    return (await db.table('students').where('userId').equals(userId).first()) || MOCK_STUDENTS[0] || null;
  } catch {
    return MOCK_STUDENTS[0] || null;
  }
};

export const getStudentGenderBreakdown = async (tenantId: string = 'tenant-demo') => {
  const students = await getStudents(tenantId);
  const male = students.filter((s) => s.gender === 'L').length;
  const female = students.filter((s) => s.gender === 'P').length;
  return { male, female, total: students.length };
};

export const updateStudent = async (id: string, data: Partial<Student>) => {
  try {
    if (db.table('students')) {
      await db.table('students').update(id, { ...data, updatedAt: Date.now() });
    }
    return true;
  } catch {
    return false;
  }
};

export const saveStudent = async (student: Student) => {
  try {
    if (db.table('students')) {
      await db.table('students').put(student);
    }
    return true;
  } catch {
    return false;
  }
};

export const deleteStudent = async (id: string) => {
  try {
    if (db.table('students')) {
      await db.table('students').delete(id);
    }
    return true;
  } catch {
    return false;
  }
};

export const lookupStudentByIdUnik = async (idUnik: string, tenantId?: string): Promise<any | null> => {
  try {
    if (!db.table('students')) {
      const found = MOCK_STUDENTS.find(s => s.idUnik === idUnik);
      return found ? { ...found, namaLengkap: found.name } : null;
    }
    const student = await db.table('students')
      .where('idUnik')
      .equals(idUnik)
      .first();
    const result = student || MOCK_STUDENTS.find(s => s.idUnik === idUnik) || null;
    return result ? { ...result, namaLengkap: result.name } : null;
  } catch {
    const found = MOCK_STUDENTS.find(s => s.idUnik === idUnik);
    return found ? { ...found, namaLengkap: found.name } : null;
  }
};

export const lookupStudentByNisn = async (nisn: string, tenantId?: string): Promise<any | null> => {
  try {
    if (!db.table('students')) {
      const found = MOCK_STUDENTS.find(s => s.nisn === nisn);
      return found ? { ...found, namaLengkap: found.name } : null;
    }
    const student = await db.table('students')
      .where('nisn')
      .equals(nisn)
      .first();
    const result = student || MOCK_STUDENTS.find(s => s.nisn === nisn) || null;
    return result ? { ...result, namaLengkap: result.name } : null;
  } catch {
    const found = MOCK_STUDENTS.find(s => s.nisn === nisn);
    return found ? { ...found, namaLengkap: found.name } : null;
  }
};

export const checkExistingUserByAttribute = async (field: string, value: string): Promise<boolean> => {
  try {
    if (!db.table('users')) return false;
    const list = await db.table('users').filter((u: any) => u[field] === value).toArray();
    return list.length > 0;
  } catch {
    return false;
  }
};

export const seedDummyStudents = async () => {
  try {
    if (db.table('students')) {
      for (const s of MOCK_STUDENTS) {
        await db.table('students').put(s);
      }
    }
  } catch {}
};

export const promoteStudents = async (
  studentIds: string[],
  targetClassName: string,
  targetClassId: string,
): Promise<boolean> => {
  try {
    if (db.table('students')) {
      for (const id of studentIds) {
        await db.table('students').update(id, {
          class: targetClassName,
          classId: targetClassId,
          updatedAt: Date.now(),
        });
      }
      return true;
    }
  } catch {}
  return false;
};

export const promoteStudentsToAlumni = async (
  studentIds: string[],
  graduationYear: string,
): Promise<boolean> => {
  try {
    if (db.table('students')) {
      for (const id of studentIds) {
        await db.table('students').update(id, {
          status: 'alumni',
          class: 'ALUMNI',
          classId: 'ALUMNI',
          graduationYear,
          updatedAt: Date.now(),
        });
      }
      return true;
    }
  } catch {}
  return false;
};

export const studentService = {
  getStudents,
  getStudentData,
  getStudentByUserId,
  getStudentGenderBreakdown,
  updateStudent,
  saveStudent,
  deleteStudent,
  seedDummyStudents,
  lookupStudentByIdUnik,
  lookupStudentByNisn,
  checkExistingUserByAttribute,
  promoteStudents,
  promoteStudentsToAlumni,
};

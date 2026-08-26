import { db } from '@/database/db';
import { Teacher } from '@/types';
import { MOCK_TEACHERS } from './mockData';

export const getTeacherData = async (tenantId: string = 'tenant-demo'): Promise<Teacher[]> => {
  try {
    if (!db.table('teachers')) return MOCK_TEACHERS;
    const list = await db.table('teachers').where('tenantId').equals(tenantId).toArray();
    return list.length > 0 ? list : MOCK_TEACHERS;
  } catch {
    return MOCK_TEACHERS;
  }
};

export const getTeachers = getTeacherData;

export const deleteTeacherIdUnik = async (idUnik: string) => {
  return true;
};

export const activateTeacherAccount = async (teacherId: string) => {
  return { success: true };
};

export const bulkImportTeachers = async (teachers: any[]) => {
  return { success: true, count: teachers.length };
};

export const uploadTeacherFile = async (file: File) => {
  return 'https://example.com/uploads/' + file.name;
};

export const lookupTeacherByNip = async (nip: string, tenantId?: string): Promise<any | null> => {
  try {
    if (!db.table('teachers')) {
      const found = MOCK_TEACHERS.find(t => t.nip === nip);
      return found ? { ...found, namaLengkap: found.name } : null;
    }
    const teacher = await db.table('teachers')
      .where('nip')
      .equals(nip)
      .first();
    const result = teacher || MOCK_TEACHERS.find(t => t.nip === nip) || null;
    return result ? { ...result, namaLengkap: result.name } : null;
  } catch {
    const found = MOCK_TEACHERS.find(t => t.nip === nip);
    return found ? { ...found, namaLengkap: found.name } : null;
  }
};

export const lookupTeacherByNik = async (nik: string, tenantId?: string): Promise<any | null> => {
  try {
    if (!db.table('teachers')) {
      const found = MOCK_TEACHERS.find((t: any) => t.nik === nik);
      return found ? { ...found, namaLengkap: found.name } : null;
    }
    const teacher = await db.table('teachers')
      .where('nik')
      .equals(nik)
      .first();
    const result = teacher || MOCK_TEACHERS.find((t: any) => t.nik === nik) || null;
    return result ? { ...result, namaLengkap: result.name } : null;
  } catch {
    const found = MOCK_TEACHERS.find((t: any) => t.nik === nik);
    return found ? { ...found, namaLengkap: found.name } : null;
  }
};

export const lookupTeacherByIdUnik = async (idUnik: string, tenantId?: string): Promise<any | null> => {
  try {
    if (!db.table('teachers')) {
      const found = MOCK_TEACHERS.find(t => t.idUnik === idUnik);
      return found ? { ...found, namaLengkap: found.name } : null;
    }
    const teacher = await db.table('teachers')
      .where('idUnik')
      .equals(idUnik)
      .first();
    const result = teacher || MOCK_TEACHERS.find(t => t.idUnik === idUnik) || null;
    return result ? { ...result, namaLengkap: result.name } : null;
  } catch {
    const found = MOCK_TEACHERS.find(t => t.idUnik === idUnik);
    return found ? { ...found, namaLengkap: found.name } : null;
  }
};

export const updateTeacher = async (teacherId: string, data: Partial<Teacher>): Promise<boolean> => {
  try {
    if (db.table('teachers')) {
      const existing = await db.table('teachers').get(teacherId);
      await db.table('teachers').put({
        ...existing,
        ...data,
        id: teacherId,
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return false;
};

export const teacherService = {
  getTeacherData,
  getTeachers,
  deleteTeacherIdUnik,
  activateTeacherAccount,
  bulkImportTeachers,
  uploadTeacherFile,
  lookupTeacherByNip,
  lookupTeacherByNik,
  lookupTeacherByIdUnik,
  updateTeacher,
};

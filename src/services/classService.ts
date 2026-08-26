import { db } from '@/database/db';
import { ClassData } from '@/types';
import { MOCK_CLASSES } from './mockData';

export const getClasses = async (tenantId: string = 'tenant-demo'): Promise<ClassData[]> => {
  try {
    if (!db.table('classes')) return MOCK_CLASSES;
    const list = await db.table('classes').where('tenantId').equals(tenantId).toArray();
    return list.length > 0 ? list : MOCK_CLASSES;
  } catch {
    return MOCK_CLASSES;
  }
};

export const getClassById = async (id: string): Promise<ClassData | null> => {
  try {
    if (!db.table('classes')) return MOCK_CLASSES[0] || null;
    return (await db.table('classes').get(id)) || MOCK_CLASSES[0] || null;
  } catch {
    return MOCK_CLASSES[0] || null;
  }
};

export const addClass = async (classData: Partial<ClassData>) => {
  const newClass: ClassData = {
    id: classData.id || `cls-${Date.now()}`,
    tenantId: classData.tenantId || 'tenant-demo',
    name: classData.name || 'Kelas Baru',
    grade: classData.grade || '7',
    academicYear: classData.academicYear || '2025/2026',
    waliKelasName: classData.waliKelasName,
    totalStudents: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  try {
    if (db.table('classes')) {
      await db.table('classes').put(newClass);
    }
  } catch {}
  return newClass;
};

export const updateClass = async (id: string, data: Partial<ClassData>): Promise<boolean> => {
  try {
    if (db.table('classes')) {
      await db.table('classes').update(id, { ...data, updatedAt: Date.now() });
      return true;
    }
  } catch {}
  return false;
};

export const deleteClass = async (id: string): Promise<boolean> => {
  try {
    if (db.table('classes')) {
      await db.table('classes').delete(id);
      return true;
    }
  } catch {}
  return false;
};

export const addClassArchive = async (classId: string, archive: any): Promise<boolean> => {
  try {
    if (db.table('classes')) {
      const cls = await db.table('classes').get(classId);
      if (cls) {
        const archives = cls.archives || [];
        archives.push(archive);
        await db.table('classes').update(classId, { archives, updatedAt: Date.now() });
        return true;
      }
    }
  } catch {}
  return false;
};

export const classService = {
  getClasses,
  getClassById,
  addClass,
  updateClass,
  deleteClass,
  addClassArchive,
};

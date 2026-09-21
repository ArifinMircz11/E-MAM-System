import { ClassData } from '@/types';
import { classRepository } from '@/repositories/classRepository';

export const getClasses = async (tenantId: string): Promise<ClassData[]> => {
  if (!tenantId) throw new Error('tenantId is required');
  return classRepository.getAll(tenantId) as Promise<ClassData[]>;
};

export const getClassById = async (id: string): Promise<ClassData | null> => {
  if (!id) throw new Error('class id is required');
  return (await classRepository.getById(id)) as ClassData | null;
};

export const addClass = async (classData: Partial<ClassData>) => {
  if (!classData.tenantId) throw new Error('tenantId is required');
  if (!classData.academicYearId && !classData.academicYear) {
    throw new Error('academicYearId is required');
  }
  const newClass: ClassData = {
    ...classData,
    id: classData.id || crypto.randomUUID(),
    tenantId: classData.tenantId,
    name: classData.name || '',
    grade: classData.grade || '',
    academicYearId: classData.academicYearId,
    academicYear: undefined,
    totalStudents: classData.totalStudents || 0,
    createdAt: classData.createdAt || Date.now(),
    updatedAt: Date.now(),
  } as ClassData;
  await classRepository.save(newClass as any);
  return newClass;
};

export const updateClass = async (id: string, data: Partial<ClassData>): Promise<boolean> => {
  const existing = await classRepository.getById(id);
  if (!existing) return false;
  await classRepository.save({ ...existing, ...data, updatedAt: Date.now() } as any);
  return true;
};

export const deleteClass = async (id: string): Promise<boolean> => {
  const existing = await classRepository.getById(id);
  if (!existing) return false;
  await classRepository.save({ ...existing, deleted: true, updatedAt: Date.now() } as any);
  return true;
};

export const addClassArchive = async (classId: string, archive: any): Promise<boolean> => {
  const cls = await classRepository.getById(classId);
  if (!cls) return false;
  const archives = Array.isArray((cls as any).archives) ? [...(cls as any).archives, archive] : [archive];
  await classRepository.save({ ...(cls as any), archives, updatedAt: Date.now() } as any);
  return true;
};

export const classService = {
  getClasses,
  getClassById,
  addClass,
  updateClass,
  deleteClass,
  addClassArchive,
};

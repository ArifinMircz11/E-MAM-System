import { ClassData } from '@/types';
import { classRepository } from '@/repositories/classRepository';
import { TenantContext } from '@/core/context/TenantContext';

export const getClasses = async (tenantId?: string): Promise<ClassData[]> => {
  return classRepository.getAll(tenantId || TenantContext.getTenantId()) as Promise<ClassData[]>;
};

export const getClassById = async (id: string): Promise<ClassData | null> => {
  return classRepository.getById(id) as Promise<ClassData | null>;
};

export const addClass = async (classData: Partial<ClassData>) => {
  const tenantId = classData.tenantId || TenantContext.getTenantId();
  const now = Date.now();
  const newClass: ClassData = {
    id: classData.id || crypto.randomUUID(),
    tenantId,
    name: classData.name || '',
    grade: classData.grade || '',
    academicYear: classData.academicYear || '',
    waliKelasName: classData.waliKelasName,
    totalStudents: classData.totalStudents || 0,
    createdAt: now,
    updatedAt: now,
  };
  await classRepository.save(newClass as any);
  return newClass;
};

export const updateClass = async (id: string, data: Partial<ClassData>): Promise<boolean> => {
  const current = await classRepository.getById(id);
  if (!current) return false;
  await classRepository.save({ ...current, ...data, updatedAt: Date.now() } as any);
  return true;
};

export const deleteClass = async (id: string): Promise<boolean> => {
  await classRepository.delete?.(id);
  return true;
};

export const addClassArchive = async (classId: string, archive: any): Promise<boolean> => {
  const cls: any = await classRepository.getById(classId);
  if (!cls) return false;
  await classRepository.save({ ...cls, archives: [...(cls.archives || []), archive], updatedAt: Date.now() } as any);
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

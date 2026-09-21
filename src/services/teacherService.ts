import { Teacher } from '@/types';
import { teacherRepository } from '@/repositories/teacherRepository';
import { TenantContext } from '@/core/context/TenantContext';

export const getTeacherData = async (tenantId?: string): Promise<Teacher[]> => {
  const activeTenant = tenantId || TenantContext.getTenantId();
  return teacherRepository.getAll(activeTenant);
};

export const getTeachers = getTeacherData;

export const deleteTeacherIdUnik = async (idUnik: string) => {
  const tenantId = TenantContext.getTenantId();
  const teachers = await teacherRepository.getAll(tenantId);
  const teacher = teachers.find((t: any) => t.idUnik === idUnik || t.id === idUnik);
  if (!teacher) return false;
  await teacherRepository.delete(teacher.id);
  return true;
};

export const activateTeacherAccount = async (_teacherId: string) => {
  return { success: false, message: 'Account activation must use the canonical user/account service.' };
};

export const bulkImportTeachers = async (teachers: Teacher[]) => {
  for (const teacher of teachers) await teacherRepository.save(teacher);
  return { success: true, count: teachers.length };
};

export const uploadTeacherFile = async (_file: File) => {
  throw new Error('Teacher file upload is not part of the operational data repository path.');
};

export const lookupTeacherByNip = async (nip: string, tenantId?: string): Promise<Teacher | null> => {
  const teachers = await getTeacherData(tenantId);
  return teachers.find((t: any) => t.nip === nip) || null;
};

export const lookupTeacherByNik = async (nik: string, tenantId?: string): Promise<Teacher | null> => {
  const teachers = await getTeacherData(tenantId);
  return teachers.find((t: any) => t.nik === nik) || null;
};

export const lookupTeacherByIdUnik = async (idUnik: string, tenantId?: string): Promise<Teacher | null> => {
  const teachers = await getTeacherData(tenantId);
  return teachers.find((t: any) => t.idUnik === idUnik || t.id === idUnik) || null;
};

export const updateTeacher = async (teacherId: string, data: Partial<Teacher>): Promise<boolean> => {
  const current = await teacherRepository.getById(teacherId);
  if (!current) return false;
  await teacherRepository.update(teacherId, { ...data, updatedAt: Date.now() });
  return true;
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

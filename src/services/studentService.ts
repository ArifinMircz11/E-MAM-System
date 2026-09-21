import type { Student } from '@/types';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

const context = () => getSecurityContext(true);

export const getStudents = async (tenantId?: string): Promise<Student[]> => {
  const ctx = context();
  const activeTenant = tenantId || ctx.tenantId;
  if (!activeTenant || activeTenant !== ctx.tenantId && !ctx.isDeveloper) throw new Error('StudentService: tenantId tidak valid.');
  return studentRepository.findAll(activeTenant);
};

export const getStudentData = getStudents;

export const getStudentsByClass = async (classId: string, tenantId?: string): Promise<Student[]> => {
  const ctx = context();
  const activeTenant = tenantId || ctx.tenantId;
  if (activeTenant !== ctx.tenantId && !ctx.isDeveloper) throw new Error('StudentService: tenant mismatch.');
  return studentRepository.findByClass(classId, activeTenant);
};

export const getStudentByUserId = async (userId: string): Promise<Student | null> => {
  const ctx = context();
  return studentRepository.fetchByUserId(ctx.tenantId, userId);
};

export const getStudentGenderBreakdown = async (tenantId?: string) => {
  const students = await getStudents(tenantId);
  return {
    male: students.filter((s) => s.gender === 'L').length,
    female: students.filter((s) => s.gender === 'P').length,
    total: students.length,
  };
};

export const updateStudent = async (id: string, data: Partial<Student>): Promise<boolean> => {
  const ctx = context();
  const current = await studentRepository.findById(id, ctx.tenantId);
  if (!current) return false;
  await studentRepository.update({ ...current, ...data } as Student);
  return true;
};

export const saveStudent = async (student: Student): Promise<boolean> => {
  await studentRepository.save(context(), student);
  return true;
};

export const deleteStudent = async (id: string): Promise<boolean> => {
  const ctx = context();
  await studentRepository.delete(id, ctx.tenantId);
  return true;
};

export const lookupStudentByIdUnik = async (idUnik: string, tenantId?: string): Promise<Student | null> => {
  const ctx = context();
  const activeTenant = tenantId || ctx.tenantId;
  const student = await studentRepository.fetchByIdUnik(activeTenant, idUnik);
  return student ? { ...student, namaLengkap: (student as any).namaLengkap || student.name } : null;
};

export const lookupStudentByNisn = async (nisn: string, tenantId?: string): Promise<Student | null> => {
  const ctx = context();
  const activeTenant = tenantId || ctx.tenantId;
  const student = await studentRepository.fetchByNisn(activeTenant, nisn);
  return student ? { ...student, namaLengkap: (student as any).namaLengkap || student.name } : null;
};

export const checkExistingUserByAttribute = async (field: string, value: string): Promise<boolean> => {
  const db = studentRepository.db;
  const users = await db.table('users').toArray();
  return users.some((u: any) => u[field] === value && u.tenantId === context().tenantId && u.deleted !== true);
};

/** Test/demo data seeding is intentionally separated from production services. */
export const seedDummyStudents = async (): Promise<void> => {
  throw new Error('Dummy student seeding is disabled in the production data path. Use an explicit test fixture/seed command.');
};

export const promoteStudents = async (
  studentIds: string[],
  targetClassName: string,
  targetClassId: string,
): Promise<boolean> => {
  const ctx = context();
  await studentRepository.promoteBatch(studentIds, ctx.tenantId, {
    class: targetClassName,
    className: targetClassName,
    classId: targetClassId,
    updatedAt: Date.now(),
  });
  return true;
};

export const promoteStudentsToAlumni = async (
  studentIds: string[],
  graduationYear: string,
): Promise<boolean> => {
  const ctx = context();
  await studentRepository.promoteBatch(studentIds, ctx.tenantId, {
    status: 'alumni',
    class: 'ALUMNI',
    className: 'ALUMNI',
    classId: 'ALUMNI',
    graduationYear,
    updatedAt: Date.now(),
  });
  return true;
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

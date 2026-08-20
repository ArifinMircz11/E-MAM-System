import type { GradeEntity } from '@/repositories/gradeRepository';
import { gradeRepository } from '@/repositories/gradeRepository';
import { subjectRepository } from '@/repositories/SubjectRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  teacherId?: string;
  className?: string;
}

export type { GradeEntity };

export const getSubjects = async (): Promise<Subject[]> => {
  try {
    const secCtx = getSecurityContext();
    const data = await subjectRepository.fetchByTenant(secCtx, secCtx.tenantId);
    return data.map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      teacherId: s.teacherId,
    }));
  } catch (error) {
    console.warn('Failed to fetch subjects', error);
    return [];
  }
};

export const getGradesByClass = async (className: string): Promise<GradeEntity[]> => {
  try {
    const secCtx = getSecurityContext();
    const results = await gradeRepository.getByClass(secCtx, className);
    return results.map(r => ({
      ...r,
      studentId: r.studentId || (r as any).studentsId // Handle potential legacy key
    }));
  } catch (error) {
    console.warn('Failed to fetch grades by class', error);
    return [];
  }
};

export const getGradesByStudent = async (studentId: string): Promise<GradeEntity[]> => {
  try {
    const secCtx = getSecurityContext();
    return await gradeRepository.getByStudent(secCtx, studentId);
  } catch (error) {
    console.warn('Failed to fetch grades by student', error);
    return [];
  }
};

export const saveStudentGrade = async (grade: Omit<GradeEntity, 'id'>) => {
  const secCtx = getSecurityContext();
  const id = `${secCtx.tenantId}_${grade.studentId}_${grade.subjectId}_${Date.now()}`;
  await gradeRepository.create({
    ...grade,
    id,
    tenantId: secCtx.tenantId,
  } as GradeEntity);
  return { success: true, id };
};

export const saveGrade = saveStudentGrade;

export const getGradesBySubject = async (subjectId: string, className: string): Promise<GradeEntity[]> => {
  try {
    const secCtx = getSecurityContext();
    const all = await gradeRepository.getByClass(secCtx, className);
    return all.filter((g) => g.subjectId === subjectId);
  } catch (error) {
    console.warn('Failed to fetch grades by subject', error);
    return [];
  }
};

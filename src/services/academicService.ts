import type { AcademicYear, Semester, Assignment, Submission } from '@/types';
import { academicYearRepository } from '@/repositories/AcademicYearRepository';
import { semesterRepository } from '@/repositories/SemesterRepository';
import { db } from '@/database/db';

export const getActiveAcademicYear = async (tenantId: string): Promise<AcademicYear | null> => {
  if (!tenantId) throw new Error('tenantId is required');
  const years = await academicYearRepository.findAll(tenantId);
  return years.find((year) => year.isActive && !year.deleted) ?? null;
};

export const getAcademicYears = async (tenantId: string): Promise<AcademicYear[]> => {
  if (!tenantId) throw new Error('tenantId is required');
  return academicYearRepository.findAll(tenantId);
};

export const saveAcademicYear = async (academicYear: Partial<AcademicYear>, tenantId: string): Promise<boolean> => {
  if (!tenantId) throw new Error('tenantId is required');
  if (!academicYear.name?.trim()) throw new Error('Nama tahun ajaran wajib diisi');
  const entity = {
    ...academicYear,
    id: academicYear.id || crypto.randomUUID(),
    tenantId,
    isActive: Boolean(academicYear.isActive),
    updatedAt: Date.now(),
  } as AcademicYear;
  if (academicYear.id) await academicYearRepository.update(entity);
  else await academicYearRepository.create(entity);
  return true;
};

export const deleteAcademicYear = async (id: string, tenantId: string): Promise<boolean> => {
  if (!tenantId) throw new Error('tenantId is required');
  await academicYearRepository.delete(id, tenantId);
  return true;
};

export const activateAcademicYear = async (id: string, tenantId: string): Promise<boolean> => {
  if (!tenantId) throw new Error('tenantId is required');
  const years = await academicYearRepository.findAll(tenantId);
  const target = years.find((year) => year.id === id);
  if (!target) throw new Error('Tahun ajaran tidak ditemukan');
  for (const year of years) {
    const next = { ...year, isActive: year.id === id, updatedAt: Date.now() } as AcademicYear;
    await academicYearRepository.update(next);
  }
  return true;
};

export const getSemesters = async (tenantId: string, academicYearId?: string): Promise<Semester[]> => {
  if (!tenantId) throw new Error('tenantId is required');
  const list = await semesterRepository.getAll(tenantId);
  return academicYearId ? list.filter((semester) => semester.academicYearId === academicYearId) : list;
};

export const saveSemester = async (semester: Partial<Semester>, tenantId: string): Promise<boolean> => {
  if (!tenantId) throw new Error('tenantId is required');
  if (!semester.academicYearId) throw new Error('academicYearId is required');
  await semesterRepository.save({
    ...semester,
    id: semester.id || crypto.randomUUID(),
    tenantId,
    updatedAt: Date.now(),
  });
  return true;
};

export const deleteSemester = async (id: string, tenantId: string): Promise<boolean> => {
  if (!tenantId) throw new Error('tenantId is required');
  const item = (await semesterRepository.getAll(tenantId)).find((semester: any) => semester.id === id);
  if (!item) return false;
  await db.table('semesters').delete(id);
  return true;
};

export const activateSemester = async (id: string, tenantId: string): Promise<boolean> => {
  if (!tenantId) throw new Error('tenantId is required');
  const list = await semesterRepository.getAll(tenantId);
  const target = list.find((semester: any) => semester.id === id);
  if (!target) throw new Error('Semester tidak ditemukan');
  for (const semester of list) {
    await semesterRepository.save({ ...semester, isActive: semester.id === id, updatedAt: Date.now() });
  }
  return true;
};

export const getSchedules = async (classId?: string) => {
  return [];
};

export const getJournals = async (tenantId: string = 'tenant-demo', classId?: string) => {
  return [];
};

export const addJournal = async (journal: any) => {
  return { success: true, journal };
};

export const deleteJournal = async (journalId: string) => {
  return { success: true };
};

export const getAssignments = async (tenantId: string = 'tenant-demo', classId?: string): Promise<Assignment[]> => {
  try {
    if (db.table('assignments')) {
      let list = await db.table('assignments').toArray();
      if (classId) {
        list = list.filter(a => a.classId === classId || a.className === classId);
      }
      return list as Assignment[];
    }
  } catch {}
  return [];
};

export const addAssignment = async (assignment: Partial<Assignment>): Promise<boolean> => {
  try {
    if (db.table('assignments')) {
      const id = assignment.id || `asg_${Date.now()}`;
      await db.table('assignments').put({
        ...assignment,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const deleteAssignment = async (id: string): Promise<boolean> => {
  try {
    if (db.table('assignments')) {
      await db.table('assignments').delete(id);
      return true;
    }
  } catch {}
  return true;
};

export const addSubmission = async (submission: Partial<Submission>): Promise<boolean> => {
  try {
    if (db.table('submissions')) {
      const id = submission.id || `sub_${Date.now()}`;
      await db.table('submissions').put({
        ...submission,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const getSubmissions = async (assignmentId: string): Promise<Submission[]> => {
  try {
    if (db.table('submissions')) {
      const list = await db.table('submissions').toArray();
      return list.filter(s => s.assignmentId === assignmentId) as Submission[];
    }
  } catch {}
  return [];
};

export const getMySubmission = async (assignmentId: string, studentId: string): Promise<Submission | null> => {
  try {
    if (db.table('submissions')) {
      const list = await db.table('submissions').toArray();
      return list.find(s => s.assignmentId === assignmentId && s.studentId === studentId) || null;
    }
  } catch {}
  return null;
};

export const gradeSubmission = async (submissionId: string, score: number, feedback: string): Promise<boolean> => {
  try {
    if (db.table('submissions')) {
      const existing = await db.table('submissions').get(submissionId);
      await db.table('submissions').put({
        ...existing,
        id: submissionId,
        score,
        grade: score,
        feedback,
        status: 'Graded',
        gradedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const updateSubmission = async (submissionId: string, submission: Partial<Submission>): Promise<boolean> => {
  try {
    if (db.table('submissions')) {
      const existing = await db.table('submissions').get(submissionId);
      await db.table('submissions').put({
        ...existing,
        ...submission,
        id: submissionId,
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const getAllMySubmissions = async (studentId: string): Promise<Submission[]> => {
  try {
    if (db.table('submissions')) {
      const list = await db.table('submissions').toArray();
      return list.filter(s => s.studentId === studentId) as Submission[];
    }
  } catch {}
  return [];
};

export const academicService = {
  getActiveAcademicYear,
  getAcademicYears,
  saveAcademicYear,
  deleteAcademicYear,
  activateAcademicYear,
  getSemesters,
  saveSemester,
  deleteSemester,
  activateSemester,
  getSchedules,
  getJournals,
  addJournal,
  deleteJournal,
  getAssignments,
  addAssignment,
  deleteAssignment,
  addSubmission,
  getSubmissions,
  getMySubmission,
  gradeSubmission,
  updateSubmission,
  getAllMySubmissions,
};

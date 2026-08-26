import { db } from '@/database/db';
import type { AcademicYear, Semester, Assignment, Submission } from '@/types';

export const getActiveAcademicYear = async () => {
  return {
    id: 'ay-2025-2026',
    name: '2025/2026',
    semester: 'Genap',
    isActive: true,
  };
};

export const getAcademicYears = async (tenantId: string = 'tenant-demo'): Promise<AcademicYear[]> => {
  try {
    if (db.table('academic_years')) {
      const list = await db.table('academic_years').where('tenantId').equals(tenantId).toArray();
      if (list.length > 0) return list;
    }
  } catch {}
  return [
    {
      id: 'ay-2024-2025',
      name: '2024/2025',
      startDate: '2024-07-15',
      endDate: '2025-06-20',
      isActive: false,
    },
    {
      id: 'ay-2025-2026',
      name: '2025/2026',
      startDate: '2025-07-14',
      endDate: '2026-06-25',
      isActive: true,
    },
  ];
};

export const saveAcademicYear = async (academicYear: Partial<AcademicYear>, tenantId: string = 'tenant-demo'): Promise<boolean> => {
  try {
    if (db.table('academic_years')) {
      const id = academicYear.id || `ay_${Date.now()}`;
      await db.table('academic_years').put({
        ...academicYear,
        id,
        tenantId,
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const deleteAcademicYear = async (id: string): Promise<boolean> => {
  try {
    if (db.table('academic_years')) {
      await db.table('academic_years').delete(id);
    }
  } catch {}
  return true;
};

export const activateAcademicYear = async (id: string, tenantId: string = 'tenant-demo'): Promise<boolean> => {
  try {
    if (db.table('academic_years')) {
      const all = await db.table('academic_years').where('tenantId').equals(tenantId).toArray();
      for (const item of all) {
        await db.table('academic_years').update(item.id, { isActive: item.id === id });
      }
    }
  } catch {}
  return true;
};

export const getSemesters = async (tenantId: string = 'tenant-demo', academicYearId?: string): Promise<Semester[]> => {
  try {
    if (db.table('semesters')) {
      let query = db.table('semesters').where('tenantId').equals(tenantId);
      const list = await query.toArray();
      if (list.length > 0) {
        if (academicYearId) return list.filter(s => s.academicYearId === academicYearId);
        return list;
      }
    }
  } catch {}
  return [
    {
      id: 'sem-1',
      academicYearId: 'ay-2025-2026',
      name: 'Ganjil',
      isActive: false,
    },
    {
      id: 'sem-2',
      academicYearId: 'ay-2025-2026',
      name: 'Genap',
      isActive: true,
    },
  ];
};

export const saveSemester = async (semester: Partial<Semester>, tenantId: string = 'tenant-demo'): Promise<boolean> => {
  try {
    if (db.table('semesters')) {
      const id = semester.id || `sem_${Date.now()}`;
      await db.table('semesters').put({
        ...semester,
        id,
        tenantId,
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const deleteSemester = async (id: string): Promise<boolean> => {
  try {
    if (db.table('semesters')) {
      await db.table('semesters').delete(id);
    }
  } catch {}
  return true;
};

export const activateSemester = async (id: string, tenantId: string = 'tenant-demo'): Promise<boolean> => {
  try {
    if (db.table('semesters')) {
      const all = await db.table('semesters').where('tenantId').equals(tenantId).toArray();
      for (const item of all) {
        await db.table('semesters').update(item.id, { isActive: item.id === id });
      }
    }
  } catch {}
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

/**
 * @license
 * e-Mam System - Academic Service
 * LAYER: SERVICE (Architecture Compliant)
 */

import { isMockMode } from './firebase';


import type { JournalEntry, AcademicYear, Assignment, Submission, Semester} from '@/types';
import { PERMISSIONS } from '@/types';
import { assignmentRepository } from '@/repositories/AssignmentRepository';
import { submissionRepository } from '@/repositories/SubmissionRepository';
import { academicYearRepository } from '@/repositories/AcademicYearRepository';
import { semesterRepository } from '@/repositories/SemesterRepository';
import { journalRepository } from '@/repositories/journalRepository';
import { incrementMasterVersion } from './systemService';
import { generateManualId } from '@/utils/firestoreHelpers';
import { TenantContext } from '@/core/context/TenantContext';
import { assertPermission } from './securityService';

// --- Assignments & Submissions ---
export const getAssignments = async (className?: string): Promise<Assignment[]> => {
  assertPermission(PERMISSIONS.CLASS_READ, 'Get Assignments');
  if (isMockMode) return [];
  try {
    const tenantId = TenantContext.getTenantId();
    if (className) {
      return await assignmentRepository.findByClass(tenantId, className);
    }
    return await assignmentRepository.findAll(tenantId);
  } catch (e) {
    console.error('[academicService] Error loading assignments:', e);
    return [];
  }
};

export const addAssignment = async (data: any): Promise<string> => {
  assertPermission(PERMISSIONS.CLASS_WRITE, 'Add Assignment');
  const tenantId = TenantContext.getTenantId();
  const id = data.id || generateManualId(`${tenantId}_ASGN_${Date.now()}`);
  await assignmentRepository.create({ ...data, id, tenantId });
  return id;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  assertPermission(PERMISSIONS.CLASS_WRITE, 'Delete Assignment');
  const tenantId = TenantContext.getTenantId();
  await assignmentRepository.delete(id, tenantId);
};

export const getSubmissions = async (assignmentId: string): Promise<Submission[]> => {
  assertPermission(PERMISSIONS.CLASS_READ, 'Get Submissions');
  if (isMockMode) return [];
  try {
    const tenantId = TenantContext.getTenantId();
    return await submissionRepository.findByAssignment(tenantId, assignmentId);
  } catch (e) {
    console.error('[academicService] Error loading submissions:', e);
    return [];
  }
};

export const getAllMySubmissions = async (studentId: string): Promise<Submission[]> => {
  if (isMockMode) return [];
  try {
    const tenantId = TenantContext.getTenantId();
    return await submissionRepository.findByStudent(tenantId, studentId);
  } catch (e) {
    console.error('[academicService] Error loading my submissions:', e);
    return [];
  }
};

export const getMySubmission = async (
  assignmentId: string,
  studentId: string,
): Promise<Submission | null> => {
  if (isMockMode) return null;
  const tenantId = TenantContext.getTenantId();
  return await submissionRepository.findByStudentAndAssignment(tenantId, studentId, assignmentId);
};

export const addSubmission = async (data: Omit<Submission, 'id'>): Promise<string> => {
  const tenantId = TenantContext.getTenantId();
  const id = generateManualId(`${tenantId}_SUB_${data.studentId}_${data.assignmentId}`);
  await submissionRepository.create({ ...data, id, tenantId } as Submission);
  return id;
};

export const updateSubmission = async (id: string, content: string): Promise<void> => {
  const tenantId = TenantContext.getTenantId();
  const sub = await submissionRepository.findById(id, tenantId);
  if (sub) {
    await submissionRepository.update({ ...sub, content, updatedAt: Date.now() });
  }
};

export const gradeSubmission = async (
  id: string,
  grade: number,
  feedback: string,
): Promise<void> => {
  assertPermission(PERMISSIONS.CLASS_WRITE, 'Grade Submission');
  const tenantId = TenantContext.getTenantId();
  const sub = await submissionRepository.findById(id, tenantId);
  if (sub) {
    await submissionRepository.update({
      ...sub,
      grade,
      feedback,
      status: 'Graded',
      updatedAt: Date.now(),
    });
  }
};

const JOURNALS_COL = 'journals';

/**
 * Fetch all academic years with local-first strategy.
 */
export const getAcademicYears = async (forceRefresh = false): Promise<AcademicYear[]> => {
  assertPermission(PERMISSIONS.CLASS_READ, 'Get Academic Years');
  if (isMockMode) {
    return [
      { id: '1', name: '2025/2026', isActive: true, tenantId: '30315537' },
      { id: '2', name: '2024/2025', isActive: false, tenantId: '30315537' },
    ] as any;
  }

  try {
    const tenantId = TenantContext.getTenantId();
    const data = await academicYearRepository.findAll(tenantId);
    return ((data || []).sort((a, b) => (b.name || '').localeCompare(a.name || ''))) as any;
  } catch (error) {
    console.error('[academicService] Error loading academic years:', error);
    return [];
  }
};

/**
 * Save academic year (Create or Update).
 */
export const saveAcademicYear = async (data: Partial<AcademicYear>) => {
  assertPermission(PERMISSIONS.SYSTEM_CONFIG, 'Save Academic Year');
  try {
    const context = TenantContext.getContext();
    const id = data.id || `${context.tenantId}_${data.name?.replace(/\//g, '_')}`;
    const existing = await academicYearRepository.findById(id, context.tenantId);
    const finalData = {
      ...(existing || {}),
      ...data,
      id,
      tenantId: context.tenantId,
      updatedAt: Date.now(),
    } as AcademicYear;

    if (existing) {
      await academicYearRepository.update(finalData as any);
    } else {
      await academicYearRepository.create(finalData as any);
    }

    // 3. Update System State
    await incrementMasterVersion();

    return { success: true, id };
  } catch (error) {
    console.error('[academicService] Error saving academic year:', error);
    throw error;
  }
};

/**
 * Delete academic year.
 */
export const deleteAcademicYear = async (id: string) => {
  assertPermission(PERMISSIONS.SYSTEM_CONFIG, 'Delete Academic Year');
  try {
    const context = TenantContext.getContext();

    // Local delete automatically handles sync queue enrollment
    await academicYearRepository.delete(id, context.tenantId);

    await incrementMasterVersion();
    return { success: true };
  } catch (error) {
    console.error('[academicService] Error deleting academic year:', error);
    throw error;
  }
};

/**
 * Atomic switch for active academic year.
 */
export const activateAcademicYear = async (id: string, allYears: AcademicYear[]) => {
  assertPermission(PERMISSIONS.SYSTEM_CONFIG, 'Activate Academic Year');
  try {
    const context = TenantContext.getContext();

    for (const y of allYears) {
      const isActive = y.id === id;
      // Repository save handles both local and sync queue
      await academicYearRepository.update({ ...y, isActive } as any);
    }

    await incrementMasterVersion();

    return { success: true };
  } catch (error) {
    console.error('[academicService] Error activating academic year:', error);
    throw error;
  }
};

/**
 * Fetch teacher journals.
 */
export const getJournals = async (
  teacherId?: string,
  forceRefresh = false,
): Promise<JournalEntry[]> => {
  assertPermission(PERMISSIONS.ATTENDANCE_READ, 'Get Journals');
  if (isMockMode) return [];

  try {
    const tenantId = TenantContext.getTenantId();
    const results = await journalRepository.getByTenant(tenantId);

    const filtered = teacherId ? results.filter((j) => j.teacherId === teacherId) : results;

    return filtered.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
  } catch (error: any) {
    console.error('[academicService] Error loading journals:', error);
    return [];
  }
};

/**
 * Add a new classroom journal entry.
 */
export const addJournal = async (entry: Omit<JournalEntry, 'id'>): Promise<string> => {
  assertPermission(PERMISSIONS.ATTENDANCE_WRITE, 'Add Journal');
  if (isMockMode) return 'mock-journal-id';

  try {
    const tenantId = TenantContext.getTenantId();
    const manualId = generateManualId(
      `${tenantId}_JRN_${entry.teacherId}_${entry.date}_${entry.className}_${Date.now()}`,
    );

    // Repository save automatically handles local write + sync queue enrollment
    await journalRepository.create({ ...entry, id: manualId, tenantId } as any);

    return manualId;
  } catch (error: any) {
    console.error('[academicService] Error adding journal:', error);
    throw error;
  }
};

/**
 * Delete a journal entry.
 */
export const deleteJournal = async (id: string): Promise<void> => {
  assertPermission(PERMISSIONS.ATTENDANCE_WRITE, 'Delete Journal');
  if (isMockMode) return;
  try {
    const tenantId = TenantContext.getTenantId();
    await journalRepository.delete(id, tenantId);
  } catch (error: any) {
    console.error('[academicService] Error deleting journal:', error);
    throw error;
  }
};

/**
 * Helper to get active academic year.
 */
export const getActiveAcademicYear = async (): Promise<AcademicYear | null> => {
  try {
    const years = await getAcademicYears();
    return years.find((y) => y.isActive) || years[0] || null;
  } catch (error) {
    return null;
  }
};

/**
 * --- SEMESTER OPERATIONS ---
 */

/**
 * Fetch all semesters for a tenant.
 */
export const getSemesters = async (academicYearId?: string): Promise<Semester[]> => {
  assertPermission(PERMISSIONS.CLASS_READ, 'Get Semesters');
  try {
    const tenantId = TenantContext.getTenantId();
    // Using Dexie where clause for efficiency as per AGENTS.md
    const results = await semesterRepository.fetchByTenant(TenantContext.getContext(), tenantId);
    
    if (academicYearId) {
      return results.filter(s => s.academicYearId === academicYearId);
    }
    
    return results;
  } catch (error) {
    console.error('[academicService] Error loading semesters:', error);
    return [];
  }
};

/**
 * Save semester (Create or Update).
 */
export const saveSemester = async (data: Partial<Semester>) => {
  assertPermission(PERMISSIONS.SYSTEM_CONFIG, 'Save Semester');
  try {
    const context = TenantContext.getContext();
    const id = data.id || generateManualId(`${context.tenantId}_SEM_${data.academicYearId}_${Date.now()}`);
    
    const existing = await semesterRepository.findById(id, context.tenantId);
    const finalData = {
      ...(existing || {}),
      ...data,
      id,
      tenantId: context.tenantId,
      updatedAt: Date.now(),
    } as Semester;

    if (existing) {
      await semesterRepository.update(finalData as any);
    } else {
      await semesterRepository.create(finalData as any);
    }

    await incrementMasterVersion();
    return { success: true, id };
  } catch (error) {
    console.error('[academicService] Error saving semester:', error);
    throw error;
  }
};

/**
 * Delete semester.
 */
export const deleteSemester = async (id: string) => {
  assertPermission(PERMISSIONS.SYSTEM_CONFIG, 'Delete Semester');
  try {
    const context = TenantContext.getContext();
    await semesterRepository.delete(id, context.tenantId);
    await incrementMasterVersion();
    return { success: true };
  } catch (error) {
    console.error('[academicService] Error deleting semester:', error);
    throw error;
  }
};

/**
 * Activate semester within an academic year.
 */
export const activateSemester = async (id: string, academicYearId: string) => {
  assertPermission(PERMISSIONS.SYSTEM_CONFIG, 'Activate Semester');
  try {
    const context = TenantContext.getContext();
    const allInYear = await getSemesters(academicYearId);

    for (const s of allInYear) {
      const isActive = s.id === id;
      await semesterRepository.update({ ...s, isActive } as any);
    }

    await incrementMasterVersion();
    return { success: true };
  } catch (error) {
    console.error('[academicService] Error activating semester:', error);
    throw error;
  }
};

/**
 * @license
 * e-Mam System - Letter Service (PTSP)
 * LAYER: SERVICE (Architecture Compliant - Offline First, No Firebase Imports)
 */

import type { LetterRequest, LetterStatus} from '@/types';
import { UserRole } from '@/types';
import { SyncStatus } from '@/domain/entities/base';
import { letterRepository } from '@/repositories/letterRepository';
import { attendanceRepository } from '@/repositories/attendanceRepository';
import { TenantContext } from '@/core/context/TenantContext';

/**
 * Get all letter requests for the current user/tenant from Dexie via repository.
 */
export const getLetters = async (forceRefresh = false): Promise<LetterRequest[]> => {
  try {
    const context = TenantContext.getContext();
    const results = await letterRepository.fetchByTenant(context.tenantId);

    // Filter by role if not admin
    const userRoles = context.roles || (context.role ? [context.role] : []);
    const isAdmin = userRoles.some((r: string) =>
      [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.STAF, UserRole.KEPALA_MADRASAH].includes(
        r as any,
      ),
    );

    const filtered = isAdmin ? results : results.filter((l) => l.userId === context.uid);

    return filtered.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    ) as any;
  } catch (error) {
    console.error('[letterService] Error loading letters:', error);
    return [];
  }
};

/**
 * Get letters filtered by class.
 */
export const getLettersByClass = async (
  className: string,
  forceRefresh = false,
): Promise<LetterRequest[]> => {
  const letters = await getLetters(forceRefresh);
  return letters.filter((l) => l.classId === className || l.className === className);
};

/**
 * Create a new letter request.
 */
export const createLetterRequest = async (request: Omit<LetterRequest, 'id'>): Promise<string> => {
  try {
    const context = TenantContext.getContext();
    const manualId = `LTR_${context.tenantId}_${context.uid}_${Date.now()}`;

    const newRequest: LetterRequest = {
      ...request,
      id: manualId,
      tenantId: context.tenantId,
      userId: context.uid,
      status: 'Pending',
      syncStatus: SyncStatus.PENDING,
      version: 1,
      schemaVersion: 1,
      deleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const tenantId = context.tenantId;
    await letterRepository.create(newRequest as LetterRequest);

    return manualId;
  } catch (error: any) {
    console.error('[letterService] createLetterRequest error:', error);
    throw error;
  }
};

/**
 * Update letter status with side effects (e.g. auto-attendance).
 */
export const updateLetterStatus = async (
  id: string,
  status: LetterStatus,
  data?: Partial<LetterRequest>,
): Promise<void> => {
  try {
    const context = TenantContext.getContext();
    const tenantId = context.tenantId;

    const letterData = await letterRepository.findById(id, tenantId);
    if (!letterData) throw new Error('Surat tidak ditemukan');

    const updatedLetter = { ...letterData, status, ...data, updatedAt: Date.now() };
    await letterRepository.update(updatedLetter);

    if (status === 'Signed') {
      await handleAutoAttendance(context, updatedLetter as any);
    }
  } catch (error) {
    console.error('[letterService] updateLetterStatus error:', error);
    throw error;
  }
};

/**
 * Internal helper to handle auto-attendance when a letter is signed.
 */
async function handleAutoAttendance(context: any, letter: LetterRequest) {
  try {
    const targetDate = (letter as any).date
      ? (letter as any).date.split('T')[0]
      : new Date().toISOString().split('T')[0];
    const tenantId = context.tenantId;

    const { studentRepository } = await import('@/features/students/repositories/StudentRepository');
    const students = await studentRepository.findAll(tenantId);
    const student = students.find((s) => s.linkedUserId === letter.userId);

    if (student) {
      const studentId = student.idUnik || student.id;
      const attendanceId = `${studentId}_${targetDate}`;
      const typeLower = (letter.type || '').toLowerCase();
      const attStatus = typeLower.includes('sakit') ? 'Sakit' : 'Izin';

      const attendanceRecord: any = {
        id: attendanceId,
        studentsId: studentId,
        studentName: student.namaLengkap || letter.userName || 'Siswa',
        className: student.className || 'Unknown',
        classId: student.classId || 'unknown',
        date: targetDate,
        statusGlobal: attStatus as any,
        tenantId: context.tenantId as string,
        verifiedAt: new Date().toISOString(),
        linkedLetterId: letter.id,
        sessions: {
          masuk: attStatus,
          duha: attStatus,
          zuhur: attStatus,
          ashar: attStatus,
          pulang: attStatus,
        },
        totalPointsAdded: 0,
        syncStatus: SyncStatus.PENDING,
      };

      await attendanceRepository.update(attendanceRecord);
    }
  } catch (err) {
    console.error('[letterService] Failed auto-attendance trigger:', err);
  }
}

/**
 * Mark letters as read for a user
 */
export const markLettersAsRead = async (letterIds: string[]) => {
  try {
    const context = TenantContext.getContext();
    const tenantId = context.tenantId;
    for (const id of letterIds) {
      const letter = await letterRepository.findById(id, tenantId);
      if (letter) {
        await letterRepository.update({ ...letter, isRead: true } as any);
      }
    }
  } catch (error) {
    console.error('[letterService] markLettersAsRead error:', error);
  }
};

/**
 * Upload letter attachment placeholder
 */
export const uploadLetterAttachment = async (file: File) => {
  return 'https://placeholder.com/attachment.pdf';
};

/**
 * Delete a letter request.
 */
export const deleteLetter = async (id: string): Promise<void> => {
  try {
    const context = TenantContext.getContext();
    await letterRepository.delete(id, context.tenantId);
  } catch (error) {
    console.error('[letterService] deleteLetter error:', error);
    throw error;
  }
};

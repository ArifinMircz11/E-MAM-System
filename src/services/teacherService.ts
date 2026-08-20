import { useUserStore } from '@/stores/userStore';
/**
 * @license
 * e-Mam System - Teacher Service
 */

import type { Teacher} from '@/types';
import { UserRole } from '@/types';
import { teacherRepository } from '@/repositories/teacherRepository';
import { localDb } from '@/database/dexie';
import { getSecurityContext } from '@/core/security/contextHelper';
import { assertPermission } from '@/services/securityService';
import { PERMISSIONS } from '@/types/permissions';
import { CacheService } from './CacheService';
import { syncRepository } from '@/repositories/SyncRepository';

const TEA_COL = 'teachers';

/**
 * Get all teachers for the current tenant
 */
export const getTeachers = async (arg1?: string | boolean, arg2?: boolean): Promise<Teacher[]> => {
  assertPermission(PERMISSIONS.TEACHER_READ, 'Get Teachers List');
  let tenantId: string;
  let forceRefresh: boolean;

  if (typeof arg1 === 'boolean') {
    tenantId = useUserStore.getState().tenantId || 'global';
    forceRefresh = arg1;
  } else if (typeof arg1 === 'string') {
    tenantId = arg1;
    forceRefresh = !!arg2;
  } else {
    tenantId = useUserStore.getState().tenantId || 'global';
    forceRefresh = false;
  }

  if (!tenantId) return [];

  try {
    const data = await CacheService.getCollection<Teacher>(
      TEA_COL,
      localDb.teachers,
      'teachersId',
      { tenantId, forceRefresh },
    );
    return data || [];
  } catch (error) {
    console.error('[teacherService] getTeachers error:', error);
    return [];
  }
};

/**
 * Get teacher data by ID
 */
export const getTeacherData = async (teacherId: string): Promise<Teacher | null> => {
  if (!teacherId || typeof teacherId !== 'string') return null;
  try {
    const context = getSecurityContext(true);
    if (!context) throw new Error('Security context is required');
    const cached = await teacherRepository.findById(teacherId, context.tenantId);
    return cached as Teacher;
  } catch (e) {
    return null;
  }
};

/**
 * Add a new teacher
 */
export const addTeacher = async (teacherData: Teacher): Promise<string> => {
  assertPermission(PERMISSIONS.TEACHER_CREATE, 'Add Teacher');
  try {
    const id = teacherData.teachersId || `TEA_${Date.now()}`;
    const context = getSecurityContext(true);
    if (!context) throw new Error('Security context is required');
    const payload: any = {
      ...teacherData,
      idUnik: id,
      teachersId: id,
      tenantId: teacherData.tenantId || context.tenantId,
      updatedAt: Date.now(),
    };

    // Repository Save (Local + SyncQueue)
    await teacherRepository.create(payload);

    return id;
  } catch (error) {
    console.error('addTeacher error:', error);
    throw error;
  }
};

/**
 * Update an existing teacher
 */
export const updateTeacher = async (
  id: string,
  teacherData: Partial<Teacher>,
): Promise<{ success: boolean }> => {
  assertPermission(PERMISSIONS.TEACHER_UPDATE, 'Update Teacher');
  try {
    const context = getSecurityContext(true);
    if (!context) throw new Error('Security context is required');
    const existing = await teacherRepository.findById(id, context.tenantId);
    const finalPayload: any = {
      ...(existing || {}),
      ...teacherData,
      id: id,
      idUnik: existing?.idUnik || id,
      updatedAt: Date.now(),
    };
    await teacherRepository.update(finalPayload);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Delete a teacher (logical delete)
 */
export const deleteTeacher = async (id: string): Promise<{ success: boolean }> => {
  assertPermission(PERMISSIONS.TEACHER_DELETE, 'Delete Teacher');
  try {
    const context = getSecurityContext();
    
    // Repository logical delete (handles local + SyncQueue)
    await teacherRepository.delete(id, context.tenantId);

    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Hard delete a teacher by idUnik (used in account management)
 */
export const deleteTeacherIdUnik = async (
  idUnik: string,
  tenantId?: string,
): Promise<{ success: boolean }> => {
  assertPermission(PERMISSIONS.TEACHER_DELETE, 'Delete Teacher By ID Unik');
  try {
    const context = getSecurityContext(true);
    const activeTenant = tenantId || context.tenantId;

    const teacher = await teacherRepository.findByIdUnik(activeTenant, idUnik);
    if (teacher && teacher.id) {
      await teacherRepository.delete(teacher.id, activeTenant);
    }
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Activate a teacher account
 */
export const activateTeacherAccount = async (
  teacherId: string,
  email: string,
  role?: UserRole | string,
  password?: string,
): Promise<{ success: boolean }> => {
  assertPermission(PERMISSIONS.TEACHER_UPDATE, 'Activate Teacher Account');
  try {
    const { createTeacherAccount } = await import('./authService');

    // 1. Create authentication account
    const userId = await createTeacherAccount(
      email,
      password || 'madrasah123',
      (role as UserRole) || UserRole.GURU,
    );

    const context = getSecurityContext();
    const current = await teacherRepository.findById(teacherId, context.tenantId);
    if (current) {
      await teacherRepository.update({
        ...current,
        sistemJangkar: {
          tenantId: current.sistemJangkar?.tenantId || current.tenantId || '',
          userId,
          roleSistem: current.sistemJangkar?.roleSistem || String(role || UserRole.GURU),
          isClaimed: true,
          ttdDigitalUrl: current.sistemJangkar?.ttdDigitalUrl || '',
          diperbaruiPada: new Date().toISOString(),
          diperbaruiOleh: 'SYSTEM',
        },
        status: 'Aktif',
      } as any);
    }
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Bulk import teachers
 */
export const bulkImportTeachers = async (
  teachers: Teacher[],
  tenantId?: string,
): Promise<{ success: boolean; count: number }> => {
  assertPermission(PERMISSIONS.TEACHER_CREATE, 'Bulk Import Teachers');
  try {
    const context = getSecurityContext();
    const activeTenant = tenantId || context.tenantId || 'global';

    for (const teacher of teachers) {
      const id = teacher.teachersId || `TEA_BULK_${Math.random().toString(36).substring(7)}`;
      const payload: any = {
        ...teacher,
        idUnik: teacher.idUnik || id,
        teachersId: id,
        tenantId: activeTenant,
        updatedAt: Date.now(),
      };
      await teacherRepository.create(payload);
    }
    return { success: true, count: teachers.length };
  } catch (error) {
    return { success: false, count: 0 };
  }
};

/**
 * Seed initial teachers (for dev console)
 */
export const seedInitialTeachers = async (teachers: Teacher[]): Promise<{ success: boolean }> => {
  assertPermission(PERMISSIONS.TEACHER_CREATE, 'Seed Initial Teachers');
  try {
    const context = getSecurityContext();
    for (const teacher of teachers) {
      const id = teacher.teachersId || teacher.idUnik || teacher.id;
      if (!id) continue;
      const payload: any = {
        ...teacher,
        idUnik: teacher.idUnik || id,
        teachersId: id,
        updatedAt: Date.now(),
      };
      await teacherRepository.update(payload);
    }
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Upload a file related to a teacher
 */
export const uploadTeacherFile = async (file: File, teacherId: string): Promise<string> => {
  assertPermission(PERMISSIONS.TEACHER_UPDATE, 'Upload Teacher File');
  try {
    const context = getSecurityContext();
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const storagePath = `teachers/${teacherId}/archives/${timestamp}_${safeName}`;

    // Enqueue file upload to SyncQueue
    // In e-Mam System, files are handled by the SyncEngine in Phase 3
    await syncRepository.enqueue({
      tenantId: context.tenantId,
      collection: 'storage' as any,
      action: 'UPLOAD_FILE' as any,
      payload: {
        path: storagePath,
        teacherId,
        fileName: safeName,
        mimeType: file.type,
        lastModified: file.lastModified
      }
    });

    // Return a temporary local URL or a placeholder
    // The SyncEngine will update the real URL once uploaded
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('[teacherService] uploadTeacherFile error:', error);
    throw error;
  }
};

/**
 * Lookups
 */
export const lookupTeacherByNip = async (
  nip: string,
  tenantId: string,
) => {
  try {
    if (!tenantId || !nip) return null;

    const context = getSecurityContext();
    return await teacherRepository.findByNip(context.tenantId, nip);
  } catch (e) {
    return null;
  }
};

export const lookupTeacherByNik = async (
  nik: string,
  tenantId: string,
) => {
  try {
    if (!tenantId || !nik) return null;

    const context = getSecurityContext();
    return await teacherRepository.findByNik(context.tenantId, nik);
  } catch (e) {
    return null;
  }
};

export const lookupTeacherByIdUnik = async (
  idUnik: string,
  tenantId: string,
) => {
  try {
    if (!tenantId || !idUnik) return null;

    const context = getSecurityContext();
    return await teacherRepository.findByIdUnik(context.tenantId, idUnik);
  } catch (e) {
    return null;
  }
};

export const teacherService = {
  async getTeacherProfile(teacherId: string, tenantId: string): Promise<Teacher | null> {
    return getTeacherData(teacherId);
  },
};

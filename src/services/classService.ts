/**
 * @license
 * e-Mam System - Class Service
 * LAYER: SERVICE (Architecture Compliant)
 */

import type { ClassData} from '@/types';
import { PERMISSIONS } from '@/types';
import { CacheService } from './CacheService';
import { classRepository } from '@/repositories/classRepository';
import { TenantContext } from '@/core/context/TenantContext';
import { assertPermission, can } from './securityService';

const COLLECTION = 'classes';

/**
 * Get all classes for the current tenant.
 * Uses CacheService for automated Dexie/Firestore synchronization.
 */
export const getClasses = async (forceRefresh = false): Promise<ClassData[]> => {
  if (!can(PERMISSIONS.CLASS_READ)) {
    console.warn('[classService] Allowing class list fetch for onboarding or guest user');
  }
  try {
    const context = TenantContext.getContext();
    let data = await CacheService.getCollection<ClassData>(COLLECTION, null, 'id', {
      tenantId: context.tenantId,
      forceRefresh,
    });

    if (!data || data.length === 0) {
      const defaultClasses: Partial<ClassData>[] = [
        { classId: 'cls_10a', name: 'X-A', level: '10', academicYear: '2025/2026', tenantId: context.tenantId },
        { classId: 'cls_10b', name: 'X-B', level: '10', academicYear: '2025/2026', tenantId: context.tenantId },
        { classId: 'cls_11a', name: 'XI-A', level: '11', academicYear: '2025/2026', tenantId: context.tenantId },
        { classId: 'cls_11b', name: 'XI-B', level: '11', academicYear: '2025/2026', tenantId: context.tenantId },
        { classId: 'cls_12a', name: 'XII-A', level: '12', academicYear: '2025/2026', tenantId: context.tenantId },
        { classId: 'cls_12b', name: 'XII-B', level: '12', academicYear: '2025/2026', tenantId: context.tenantId },
      ];

      for (const cls of defaultClasses) {
        const id = cls.id || `${context.tenantId}_${cls.level}_${cls.name?.replace(/\s+/g, '_')}`;
        await classRepository.update({
          ...cls,
          id,
          tenantId: cls.tenantId || context.tenantId,
          updatedAt: new Date().toISOString(),
        } as any);
      }

      data = await classRepository.findAll(context.tenantId) as unknown as ClassData[];
    }

    return data || [];
  } catch (error: any) {
    console.error('[classService] getClasses error:', error);
    return [];
  }
};

/**
 * Get a single class by ID with local-first strategy.
 */
export const getClassById = async (classId: string): Promise<ClassData | null> => {
  if (!can(PERMISSIONS.CLASS_READ)) {
    console.warn('[classService] Allowing class fetch by ID for guest/onboarding user');
  }
  try {
    const context = TenantContext.getContext();

    // Try local repository
    const cached = await classRepository.findById(classId, context.tenantId);
    if (cached) return cached as unknown as ClassData;

    return null;
  } catch (error: any) {
    console.error(`[classService] Error fetching class ${classId}:`, error);
    return null;
  }
};

/**
 * Save or update a class.
 * Enforces deterministic ID and tenant isolation.
 */
export const saveClass = async (
  classData: Partial<ClassData>,
): Promise<{ success: boolean; id?: string }> => {
  assertPermission(PERMISSIONS.CLASS_WRITE, 'Save Class');
  try {
    const context = TenantContext.getContext();

    // Deterministic ID generation for classes if not provided
    const id =
      classData.id ||
      `${context.tenantId}_${classData.level}_${classData.name?.replace(/\s+/g, '_')}`;

    const payload = {
      ...classData,
      id,
      tenantId: classData.tenantId || context.tenantId,
      updatedAt: new Date().toISOString(),
    };

    // Repository save automatically handles local write + sync queue enrollment
    await classRepository.update(payload as any);

    return { success: true, id };
  } catch (error: any) {
    console.error('[classService] saveClass error:', error);
    return { success: false };
  }
};

export const addClass = async (classData: ClassData) => saveClass(classData);
export const updateClass = async (id: string, classData: Partial<ClassData>) =>
  saveClass({ ...classData, id });

/**
 * Delete a class (Logical delete).
 */
export const deleteClass = async (id: string): Promise<{ success: boolean }> => {
  assertPermission(PERMISSIONS.CLASS_WRITE, 'Delete Class');
  try {
    const context = TenantContext.getContext();

    // Repository delete handles local + sync queue
    await classRepository.delete(id, context.tenantId);

    return { success: true };
  } catch (error: any) {
    console.error('[classService] deleteClass error:', error);
    return { success: false };
  }
};

/**
 * Add a document to the class archive array.
 */
export const addClassArchive = async (
  classId: string,
  archiveItem: any,
): Promise<{ success: boolean }> => {
  assertPermission(PERMISSIONS.CLASS_WRITE, 'Add Class Archive');
  try {
    const context = TenantContext.getContext();

    // 2. Update local cache
    const current = await classRepository.findById(classId, context.tenantId);
    if (current) {
      const archives = (current as any).archives || [];
      await classRepository.update({
        ...current,
        archives: [...archives, archiveItem],
        updatedAt: new Date().toISOString(),
      } as any);
    }

    return { success: true };
  } catch (error: any) {
    console.error('[classService] addClassArchive error:', error);
    return { success: false };
  }
};

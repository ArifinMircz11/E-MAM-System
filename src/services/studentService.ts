import { useUserStore } from '@/stores/userStore';
import type { SecurityContext } from '@/core/security/types';
import { env } from '@/core/config/env';

/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: STUDENT REPOSITORY (MODULAR SDK)
 */

import { MOCK_STUDENTS } from './mockData';
import type { Student, UserRole } from '@/types';
import { safeParseStudent } from '@/utils/studentValidator';
import { normalizeRombelName, isRombelEqual, generateClassId } from '@/utils/rombelHelpers';
import { incrementMasterVersion } from './systemService';
import { updateGenderAggregate, getStudentGenderStats } from './studentAggregateService';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { classRepository } from '@/repositories/classRepository';
import { userRepository } from '@/repositories/userRepository';
import { localDb } from '@/database/dexie';
import { getSecurityContext } from '@/core/security/contextHelper';
import { assertPermission } from '@/services/securityService';
import { PERMISSIONS } from '@/types/permissions';

const STU_COL = 'students';

/**
 * Mendapatkan data siswa berdasarkan UID User yang tertaut
 */
export const getStudentByUserId = async (userId: string): Promise<Student | null> => {
  try {
    assertPermission(PERMISSIONS.STUDENT_READ, 'Get Student By User ID');
    const secCtx = getSecurityContext();
    
    // Security Restriction: Siswa only sees their own data
    if (secCtx.role === 'siswa' && secCtx.uid !== userId) {
      console.warn(`[Security] Siswa ${secCtx.uid} attempted to access student data for user ${userId}`);
      return null;
    }
    
    return await studentRepository.fetchByUserId(secCtx.tenantId, userId);
  } catch (e) {
    console.error('[studentService] getStudentByUserId error:', e);
    return null;
  }
};

export const getStudentData = async (studentsId: string): Promise<Student | null> => {
  if (!studentsId) return null;
  try {
    assertPermission(PERMISSIONS.STUDENT_READ, 'Get Student Data');
    const secCtx = getSecurityContext();
    
    // Security Restriction: Siswa only sees their own data
    if (secCtx.role === 'siswa' && secCtx.referenceId !== studentsId) {
      console.warn(`[Security] Siswa ${secCtx.referenceId} attempted to access student ${studentsId}`);
      return null;
    }

    const cached = await studentRepository.findById(studentsId, secCtx.tenantId);
    return cached ? safeParseStudent(cached, studentsId) : null;
  } catch (e) {
    console.error('Error fetching student:', e);
    return null;
  }
};

export const getStudents = async (
  className?: string,
  bypassFilter: boolean = true,
  useCache: boolean = true,
): Promise<Student[]> => {
  const isMockMode = env.MOCK_MODE;
  if (isMockMode) {
    return MOCK_STUDENTS.map((s) => ({ ...s, id: s.idUnik }) as Student);
  }

  try {
    assertPermission(PERMISSIONS.STUDENT_READ, 'Get Students List');
    const secCtx = getSecurityContext();
    const allStudents = await studentRepository.getByTenant(secCtx.tenantId);

    const healedList = allStudents.map((s) => safeParseStudent(s));
    
    // Security Restriction: Siswa only sees their own data
    let authorizedList = healedList;
    if (secCtx.role === 'siswa') {
      if (!secCtx.referenceId) return []; // Fail closed if referenceId is missing
      authorizedList = healedList.filter(
        (s) => s.id === secCtx.referenceId || s.idUnik === secCtx.referenceId || s.studentsId === secCtx.referenceId
      );
    }

    const targetClass = className || 'All';
    const filtered =
      targetClass === 'All'
        ? authorizedList.filter((s) => s.status === 'Aktif')
        : authorizedList.filter(
            (s) => isRombelEqual(s.tingkatRombel, targetClass) && s.status === 'Aktif',
          );

    return filtered.sort((a, b) => (a.namaLengkap || '').localeCompare(b.namaLengkap || ''));
  } catch (error) {
    console.error('Error loaded students list:', error);
    return [];
  }
};

export const getStudentsByClass = async (
  className: string,
  bypassFilter: boolean = false,
): Promise<Student[]> => {
  return await getStudents(className, bypassFilter, true);
};

/**
 * Menambahkan siswa baru (Unified Creation Path)
 */
export const createStudent = async (data: Partial<Student>): Promise<Student> => {
  assertPermission(PERMISSIONS.STUDENT_CREATE, 'Create Student');
  const secCtx = getSecurityContext();
  const tenantId = data.tenantId || secCtx.tenantId || useUserStore.getState().tenantId;
  if (!tenantId) throw new Error('tenantId required');

  // 1. Generate idUnik if not provided (Format: STD-YYYY-Random)
  const idUnik = data.idUnik || `STD-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  // 2. Normalize Data
  const normalizedClass = normalizeRombelName(
    data.className || data.tingkatRombel || data.rombel || 'BELUM_DISET',
  );
  const classId = data.classId || generateClassId(tenantId, normalizedClass);

  const studentData: Student = {
    ...data,
    idUnik,
    id: idUnik, // Ensure id matches idUnik
    studentsId: idUnik,
    tenantId,
    className: normalizedClass,
    classId: classId,
    tingkatRombel: normalizedClass,
    rombel: normalizedClass,
    tingkat: normalizedClass.split(' ')[0] || '',
    isClaimed: data.isClaimed ?? false,
    status: data.status || 'Aktif',
    sistemJangkar: {
      ...(data.sistemJangkar || {}),
      tenantId,
      classRef: classId,
      didaftarkanPada: new Date().toISOString(),
      statusSistem: 'Aktif',
    },
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: Date.now(),
  } as Student;

  // 3. Validation
  const validated = safeParseStudent(studentData, idUnik);

  // 4. Persistence to Dexie (Repository handles sync queue)
  await studentRepository.create(validated);

  // 5. Update Aggregates
  await updateGenderAggregate(
    tenantId,
    validated.tingkatRombel || 'Unknown',
    validated.jenisKelamin || 'L',
    1,
  ).catch(err => console.warn('Aggregate update failed:', err));

  return validated;
};

export const addStudent = async (student: Student) => {
  return await createStudent(student);
};

export const updateStudent = async (id: string, data: Partial<Student>) => {
  try {
    assertPermission(PERMISSIONS.STUDENT_UPDATE, 'Update Student');
    const updateData = {
      ...data,
      updatedAt: Date.now(),
    };

    const secCtx = getSecurityContext();
    const localObj = await studentRepository.findById(id, secCtx.tenantId);
    if (localObj) {
      // Offline-First Flow: Save updated entity to Dexie.
      await studentRepository.update({ ...localObj, ...updateData } as Student);
    }
  } catch (error) {
    console.error('updateStudent error:', error);
  }
};

export const deleteStudent = async (id: string) => {
  try {
    assertPermission(PERMISSIONS.STUDENT_DELETE, 'Delete Student');
    const secCtx = getSecurityContext();
    const current = await studentRepository.findById(id, secCtx.tenantId);
    if (current) {
      // Adjust gender aggregate counter
      await updateGenderAggregate(
        current.tenantId,
        current.tingkatRombel || 'Unknown',
        current.jenisKelamin || 'L',
        -1,
      ).catch(err => console.warn('Aggregate update failed:', err));
    }

    // Soft delete locally.
    await studentRepository.delete(id, secCtx.tenantId);
  } catch (error) {
    console.error('deleteStudent error:', error);
  }
};

export const migrateStudentId = async (
  oldId: string,
  newId: string,
  updatedData: Partial<Student>,
) => {
  try {
    assertPermission(PERMISSIONS.STUDENT_UPDATE, 'Migrate Student ID');
    if (!oldId || !newId) throw new Error('ID lama dan ID baru wajib diisi.');
    if (oldId === newId) throw new Error('ID lama dan ID baru sama.');

    const secCtx = getSecurityContext();
    const currentData = await studentRepository.findById(oldId, secCtx.tenantId);
    if (!currentData) throw new Error(`Data siswa dengan ID ${oldId} tidak ditemukan.`);

    const finalData = {
      ...currentData,
      ...updatedData,
      idUnik: newId,
      id: newId,
      studentsId: newId,
      updatedAt: Date.now(),
    };

    // Repository handles sync queue naturally
    await studentRepository.delete(oldId, secCtx.tenantId);
    await studentRepository.create(finalData);

    await incrementMasterVersion();

    return { success: true };
  } catch (error: any) {
    console.error('Migration ID error:', error);
    throw error;
  }
};

export const deleteStudentsByUserId = async (userId: string, tenantId: string) => {
  try {
    if (!tenantId) throw new Error('tenantId required');
    const secCtx = getSecurityContext();
    const student = await studentRepository.fetchByUserId(tenantId, userId);
    if (student) {
      await studentRepository.delete(student.idUnik, tenantId);
    }
    return { success: true };
  } catch (error) {
    console.error('deleteStudentsByUserId error:', error);
    return { success: false };
  }
};

/**
 * Update student account with email and handle account claim
 */
export async function handleStudentAccount(studentId: string, email: string, currentData: any) {
  try {
    assertPermission(PERMISSIONS.STUDENT_UPDATE, 'Handle Student Account');
    const secCtx = getSecurityContext(true);
    if (!secCtx) throw new Error('Security context is required');
    const localObj = await studentRepository.findById(studentId, secCtx.tenantId);
    if (localObj) {
      await studentRepository.update({ ...localObj, email, updatedAt: Date.now() });
    }
    return { success: true, message: 'Data & Email berhasil diperbarui' };
  } catch (error) {
    console.error('handleStudentAccount error:', error);
    return { success: false, message: 'Gagal memperbarui data siswa' };
  }
}

import { triggerPasswordReset as authTriggerReset } from './authService';

/**
 * Handle password reset instructions
 */
export async function triggerPasswordReset(email: string) {
  return await authTriggerReset(email);
}

export const bulkImportStudents = async (students: Student[]) => {
  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) throw new Error('tenantId required');

  assertPermission(PERMISSIONS.STUDENT_CREATE, 'Bulk Import Students');
  
  for (const s of students) {
    try {
      await createStudent(s);
    } catch (err) {
      console.error(`Failed to import student ${s.namaLengkap}:`, err);
    }
  }
};

/**
 * Mendapatkan data siswa berdasarkan ID Unik (Primary Lookup)
 */
export const lookupStudentByIdUnik = async (
  idUnik: string,
  tenantId: string,
): Promise<Student | null> => {
  try {
    if (!tenantId) throw new Error('tenantId required');
    const secCtx = getSecurityContext(false);
    if (secCtx && secCtx.role === 'siswa' && secCtx.referenceId !== idUnik) {
      console.warn(`[Security] Siswa ${secCtx.referenceId} attempted to lookup student ${idUnik}`);
      return null;
    }
    return await studentRepository.fetchByIdUnik(tenantId, idUnik);
  } catch (e) {
    console.error('[studentService] lookupStudentByIdUnik error:', e);
    return null;
  }
};

/**
 * Mendapatkan data siswa berdasarkan NISN
 */
export const lookupStudentByNisn = async (
  nisn: string,
  tenantId: string,
): Promise<Student | null> => {
  try {
    if (!tenantId) throw new Error('tenantId required');
    const secCtx = getSecurityContext(false);
    const student = await studentRepository.fetchByNisn(tenantId, nisn);
    
    if (secCtx && secCtx.role === 'siswa' && student && secCtx.referenceId !== student.id) {
       console.warn(`[Security] Siswa ${secCtx.referenceId} attempted to lookup student by NISN ${nisn}`);
       return null;
    }
    return student;
  } catch (e) {
    console.error('[studentService] lookupStudentByNisn error:', e);
    return null;
  }
};

/**
 * Cek apakah sudah ada akun user (Pending/Active) yang tertaut ke identifier ini
 */
export const checkExistingUserByAttribute = async (
  attribute: string,
  value: string,
): Promise<boolean> => {
  try {
    const secCtx = getSecurityContext();
    // Use repository to check locally first, then Sync Engine would have handled it.
    // If we need a real-time check, this is one of the few places it might be needed,
    // but we'll try to use the repository if it supports attribute searching.
    const results = await localDb.table('users')
      .where(attribute)
      .anyOf([value, value.toUpperCase(), value.toLowerCase()])
      .toArray();
    return results.length > 0;
  } catch (e) {
    console.error(`[studentService] checkExistingUserByAttribute error for ${attribute}:`, e);
    return false;
  }
};

// Fix: Added repairStudentDatabase export for DeveloperConsole.tsx
export const repairStudentDatabase = async (onProgress: (msg: string) => void) => {
  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) throw new Error('tenantId required');

  onProgress('Fetching student records for your institution...');
  const snapData = await studentRepository.fetchByTenant(tenantId, 500);
  let count = 0;

  onProgress(`Analyzing ${snapData.length} students...`);
  for (const data of snapData) {
    let needsUpdate = false;
    const updateData: any = {};

    if (data.isClaimed === undefined) {
      updateData.isClaimed = false;
      needsUpdate = true;
    }

    if (data.idUnik === undefined && data.nisn !== undefined) {
      updateData.idUnik = data.nisn;
      needsUpdate = true;
    }

    const dirtyNames = ['undefined', 'null', 'nan', 'siswa tanpa nama'];
    if (!data.namaLengkap || dirtyNames.includes(data.namaLengkap.toLowerCase().trim())) {
      updateData.namaLengkap = (data as any).name || 'SISWA TANPA NAMA';
      needsUpdate = true;
    }

    const normalizedRombel = normalizeRombelName(
      data.tingkatRombel || data.rombel || (data as any).kelas || data.className,
    );
    const classId = generateClassId(tenantId, normalizedRombel);

    if (
      data.rombel !== normalizedRombel ||
      (data as any).kelas !== normalizedRombel ||
      data.tingkatRombel !== normalizedRombel ||
      data.className !== normalizedRombel ||
      data.classId !== classId
    ) {
      updateData.rombel = normalizedRombel;
      updateData.kelas = normalizedRombel;
      updateData.tingkatRombel = normalizedRombel;
      updateData.className = normalizedRombel;
      updateData.classId = classId;
      updateData.tingkat = normalizedRombel.split(' ')[0] || '';
      needsUpdate = true;
    }

    if (needsUpdate && data.id) {
      await studentRepository.updateFirestore(data.id, tenantId, updateData);
      count++;
    }

    if (data.isClaimed && data.linkedUserId) {
      const user = await userRepository.findById(data.linkedUserId, tenantId);
      if (user) {
        await userRepository.update({
          ...user,
          profile: {
            ...user.profile,
            displayName: data.namaLengkap,
            email: (data.email || '').toLowerCase(),
          },
          role: (data.role || 'siswa').toLowerCase() as any, // or as UserRole if UserRole is imported
          idUnik: data.idUnik,
        });
      }
    }
  }

  if (count > 0) {
    await incrementMasterVersion();
  }
  return count;
};

/**
 * Get Gender Breakdown by Class (Zero-Waste: Reads from Summary Doc)
 * Optimized for high performance and low Firestore cost
 */
export const getStudentGenderBreakdown = async () => {
  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    const stats = await getStudentGenderStats(tenantId);

    if (Object.keys(stats).length > 0) {
      return Object.entries(stats)
        .filter(([key]) => key !== 'lastUpdated')
        .map(([className, counts]: [string, any]) => ({
          className,
          male: counts.male || 0,
          female: counts.female || 0,
          total: counts.total || 0,
        }))
        .sort((a, b) => a.className.localeCompare(b.className));
    }

    const students = await getStudents();
    const breakdown: Record<string, { male: number; female: number }> = {};

    students.forEach((s) => {
      const rawRombel = s.tingkatRombel || 'Tanpa Kelas';
      const className = normalizeRombelName(rawRombel);

      if (!breakdown[className]) {
        breakdown[className] = { male: 0, female: 0 };
      }

      const gender = (s.jenisKelamin || '').toUpperCase();
      if (
        gender === 'L' ||
        gender === 'LAKI-LAKI' ||
        gender === 'LAKI LAKI' ||
        gender === 'LAKI - LAKI'
      ) {
        breakdown[className].male++;
      } else if (gender === 'P' || gender === 'PEREMPUAN') {
        breakdown[className].female++;
      }
    });

    return Object.entries(breakdown)
      .map(([className, counts]) => ({
        className,
        ...counts,
        total: counts.male + counts.female,
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  } catch (error) {
    console.warn('[studentService] getStudentClassBreakdown offline fallback:', error);
    return [];
  }
};

/**
 * Paged fetching for Student Management (Zero-Waste)
 */
export const getStudentsPaginated = async (
  tenantId: string,
  lastDoc: any = null,
  pageSize: number = 25,
  filter?: { class?: string; search?: string },
) => {
  try {
    const secCtx = getSecurityContext();
    if (secCtx.role === 'siswa') {
      if (!secCtx.referenceId) return { data: [], lastDoc: null };
      const student = await studentRepository.findById(secCtx.referenceId, secCtx.tenantId);
      const studentData = student ? [safeParseStudent(student)] : [];
      return { data: studentData, lastDoc: null };
    }
    
    return await studentRepository.fetchPaginated(tenantId, lastDoc, pageSize, filter);
  } catch (e) {
    console.error('[studentService] getStudentsPaginated error:', e);
    return { data: [], lastDoc: null };
  }
};

/**
 * Migration Logic: Pindah koleksi (Alumni/Mutasi) dengan Transactional Batch
 * Fix: Added reason parameter to match signature used in StudentData.tsx
 */
export const moveStudentToCollection = async (
  id: string,
  target: 'alumni' | 'mutasi',
  reason?: string,
) => {
  assertPermission(PERMISSIONS.STUDENT_UPDATE, 'Archive Student');
  const status = target === 'alumni' ? 'Lulus' : 'Mutasi';
  const tenantId = useUserStore.getState().tenantId || 'global';
  await studentRepository.moveToArchive(
    id,
    tenantId,
    target,
    reason || 'No reason provided',
    status,
  );
};

export const promoteStudents = async (
  studentIds: string[],
  targetClassName: string,
  targetClassId?: string,
) => {
  assertPermission(PERMISSIONS.STUDENT_UPDATE, 'Promote Students');
  const tenantId = useUserStore.getState().tenantId || 'global';
  const normalizedTarget = normalizeRombelName(targetClassName);
  const classId = targetClassId || generateClassId(tenantId || '', normalizedTarget);

  if (normalizedTarget !== 'ALUMNI' && normalizedTarget !== 'BELUM_DISET') {
    try {
      const existingClass = await classRepository.findById(classId, tenantId);
      if (!existingClass) {
        await classRepository.create({
          id: classId,
          tenantId,
          name: normalizedTarget,
          level: normalizedTarget.split(' ')[0] || '12',
          academicYear: new Date().getFullYear().toString(),
          updatedAt: new Date().toISOString(),
        } as any);
      }
    } catch (err) {
      console.warn('[studentService] Auto-create target class during promotion warning:', err);
    }
  }

  const updateData: any = {
    tingkatRombel: normalizedTarget,
    classId: classId,
  };

  await studentRepository.promoteBatch(studentIds, tenantId, updateData);
};

export const promoteStudentsToAlumni = async (studentIds: string[], graduateYear: string) => {
  for (const id of studentIds) {
    await moveStudentToCollection(id, 'alumni', `Lulus Tahun ${graduateYear}`);
  }
};

export const bulkCreate = async (
  studentsData: Partial<Student>[],
): Promise<{ successCount: number; errors: string[] }> => {
  let successCount = 0;
  const errors: string[] = [];

  for (const [index, raw] of studentsData.entries()) {
    try {
      await createStudent(raw);
      successCount++;
    } catch (err: any) {
      errors.push(`Baris ${index + 1}: ${err?.message || String(err)}`);
    }
  }

  return { successCount, errors };
};

export const bulkDeleteStudents = async (studentIds: string[]) => {
  assertPermission(PERMISSIONS.STUDENT_DELETE, 'Bulk Delete Students');
  for (const id of studentIds) {
    await deleteStudent(id);
  }
  return { success: true, count: studentIds.length };
};

export const deleteAllStudents = async () => {
  assertPermission(PERMISSIONS.STUDENT_DELETE, 'Delete All Students');
  const secCtx = getSecurityContext();
  const all = await studentRepository.findAll(secCtx.tenantId);
  for (const s of all) {
    const id = s.id || s.idUnik;
    if (id) {
      await deleteStudent(id);
    }
  }
  return { success: true, count: all.length };
};

export const studentService = {
  create: createStudent,
  update: updateStudent,
  delete: deleteStudent,
  getById: getStudentData,
  bulkCreate,
  bulkDeleteStudents,
  deleteAllStudents,
};



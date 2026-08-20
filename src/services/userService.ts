/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: USER & ACCOUNT MANAGEMENT SERVICE
 */

import { isMockMode } from './firebase';
import { auditLog } from './auditLogService';

export const auditLogSystem = async (action: string, metadata: any) => {};
import { authGateway } from './auth/AuthGateway';
import {
  sanitizeError,
  deepClean,
} from '@/utils/dataHelpers';
import {
  getDocSafe,
} from '@/services/sync/firestoreHelpers';
import { eventBus } from '@/events/eventBus';
import { useUserStore } from '@/stores/userStore';
import { UserRole } from '@/types';
import { userRepository } from '@/repositories/userRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { profileRequestRepository } from '@/repositories/ProfileRequestRepository';
import type { SecurityContext } from '@/core/security/types';
import { getSecurityContext } from '@/core/security/contextHelper';

const publishUserEvent = (name: any, data: any) => {
  eventBus.publish(name, {
    id: `evt_usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    version: '1.0.0',
    timestamp: Date.now(),
    data,
  });
};

export interface ApprovalRequest {
  id: string;
  uid?: string;
  displayName: string;
  email: string;
  role: string;
  idUnik?: string;
  nisn?: string;
  phone?: string;
  isIndependent?: boolean;
  accountStatus?: string;
  status?: string;
  tingkatRombel?: string;
  studentId?: string;
  studentsId?: string;
}

/**
 * Mendapatkan pengajuan registrasi akun baru (Pending Approvals)
 */
export const fetchPendingAccountRegistrations = async (
  tenantId: string = 'default',
): Promise<any[]> => {
  try {
    if (isMockMode) return [];
    return await userRepository.fetchPendingRegistrations(tenantId);
  } catch (e) {
    console.error('Gagal mengambil data registrasi tertunda:', e);
    return [];
  }
};

/**
 * Menyetujui pendaftaran akun baru dengan garansi ketaatan referenceId dan isolasi tenant
 */
export const approveAccountRequest = async (
  userId: string,
  data: any,
  studentFormData?: any,
  currentAdminEmail?: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const context = getSecurityContext() as any;
    const role = data.role as UserRole;
    const targetTenantId = data.tenantId || context.tenantId || '30315537';
    const rawIdUnik = studentFormData?.idUnik || data.idUnik || data.studentId || data.teacherId || data.nisn || data.nip;

    const isSiswa = [UserRole.SISWA, UserRole.KETUA_KELAS].includes(role);

    let masterDocId = '';

    if (isSiswa) {
      let student = rawIdUnik ? await studentRepository.fetchByIdUnik(targetTenantId, rawIdUnik) : null;
      if (!student && rawIdUnik) {
        student = await studentRepository.findById(rawIdUnik, targetTenantId);
      }
      
      if (student) {
        if (student.tenantId && student.tenantId !== targetTenantId) {
          throw new Error(`Cross-tenant violation: Student tenant (${student.tenantId}) differs from user tenant (${targetTenantId})`);
        }
        masterDocId = student.id;
        await studentRepository.update({
          ...student,
          isClaimed: true,
          linked: true,
          userId,
          linkedAt: Date.now(),
          updatedAt: Date.now(),
        } as any);
      } else {
        masterDocId = `STU_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await studentRepository.update({
          id: masterDocId,
          namaLengkap: (data.displayName || 'Siswa').toUpperCase(),
          email: data.email || '',
          idUnik: rawIdUnik || masterDocId,
          nisn: studentFormData?.nisn || data.nisn || '',
          tingkatRombel: studentFormData?.tingkatRombel || data.tingkatRombel || '',
          isClaimed: true,
          linked: true,
          userId,
          linkedAt: Date.now(),
          tenantId: targetTenantId,
          updatedAt: Date.now(),
        } as any);
      }
    } else {
      let teacher = rawIdUnik ? await teacherRepository.fetchByIdUnik(targetTenantId, rawIdUnik) : null;
      if (!teacher && rawIdUnik) {
        teacher = await teacherRepository.findById(rawIdUnik, targetTenantId);
      }

      if (teacher) {
        if (teacher.tenantId && teacher.tenantId !== targetTenantId) {
          throw new Error(`Cross-tenant violation: Teacher tenant (${teacher.tenantId}) differs from user tenant (${targetTenantId})`);
        }
        masterDocId = teacher.id;
        await teacherRepository.update({
          ...teacher,
          isClaimed: true,
          linked: true,
          userId,
          linkedAt: Date.now(),
          updatedAt: Date.now(),
        } as any);
      } else {
        masterDocId = `TCH_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await teacherRepository.update({
          id: masterDocId,
          namaLengkap: (data.displayName || 'Guru').toUpperCase(),
          email: data.email || '',
          idUnik: rawIdUnik || masterDocId,
          nip: studentFormData?.nip || data.nip || '',
          isClaimed: true,
          linked: true,
          userId,
          linkedAt: Date.now(),
          tenantId: targetTenantId,
          updatedAt: Date.now(),
        } as any);
      }
    }

    // Activate User
    const userData = await userRepository.findById(userId, targetTenantId);
    if (userData) {
      await userRepository.update({
        ...userData,
        referenceId: masterDocId,
        studentsId: isSiswa ? masterDocId : null,
        teachersId: !isSiswa ? masterDocId : null,
        idUnik: rawIdUnik || masterDocId,
        isClaimed: true,
        status: 'active',
        approvalStatus: 'approved',
        tenantId: targetTenantId,
        metadata: { ...userData.metadata, approvedBy: currentAdminEmail || context.uid || 'system', approvedAt: Date.now() },
      } as any);
    }

    await auditLog({
      action: 'USER_CLAIM_APPROVED',
      category: 'USER',
      details: `Disetujui pendaftaran user ${userId} terhubung ke master ${masterDocId}`,
      schoolId: targetTenantId,
    });

    return { success: true, message: `Akun ${data.displayName} berhasil disetujui.` };
  } catch (e: any) {
    console.error('Gagal menyetujui akun:', e);
    return { success: false, message: e.message };
  }
};

/**
 * Menolak pendaftaran akun baru
 */
export const rejectAccountRequest = async (
  userId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const tenantId = useUserStore.getState().tenantId || 'global';
    await userRepository.delete(userId, tenantId);
    return { success: true, message: 'Pendaftaran berhasil ditolak.' };
  } catch (e: any) {
    console.error('Gagal menolak akun:', e);
    return { success: false, message: e.message };
  }
};

/**
 * Mendapatkan pengajuan perubahan data siswa (Pending Requests) secara sinkron
 */
export const fetchPendingApprovals = async (): Promise<any[]> => {
  try {
    if (isMockMode) return [];
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    const rawList = await profileRequestRepository.fetchPending(tenantId);

    const uniqueRequests: any[] = [];
    const seenUserIds = new Set<string>();
    const duplicatesToDelete: string[] = [];

    const sortedList = [...rawList].sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || a.submittedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

    sortedList.forEach((item: any) => {
      if (!item.userId) {
        uniqueRequests.push(item);
        return;
      }
      if (seenUserIds.has(item.userId)) {
        duplicatesToDelete.push(item.id || item.requestId);
      } else {
        seenUserIds.add(item.userId);
        uniqueRequests.push(item);
      }
    });

    if (duplicatesToDelete.length > 0 && navigator.onLine) {
      await Promise.all(
        duplicatesToDelete.map((id) => profileRequestRepository.delete(id, tenantId)),
      );
      console.log(
        `[Self-Healing] Berhasil menghapus ${duplicatesToDelete.length} data pengajuan duplikat.`,
      );
    }

    return uniqueRequests;
  } catch (err) {
    console.error('Gagal mengambil data pengajuan:', sanitizeError(err));
    return [];
  }
};

/**
 * Berlangganan real-time untuk data pengajuan profil update
 */
export const subscribePendingApprovals = (
  onUpdate: (data: any[]) => void,
  onError?: (err: any) => void,
): (() => void) => {
  if (isMockMode) {
    onUpdate([]);
    return () => {};
  }

  const tenantId = useUserStore.getState().tenantId;
  if (!tenantId) throw new Error('tenantId required');

  return () => {}; // Replaced with local state polling or removed in actual hook
};

/**
 * Fetches users with custom query options (e.g., limit)
 */
export const fetchUsersByQuery = async (
  options: { limit?: number; role?: string } = {},
): Promise<any[]> => {
  try {
    if (isMockMode) return [];
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    return await userRepository.fetchByTenant(tenantId, options.limit || 50);
  } catch (e) {
    console.error('[userService] fetchUsersByQuery error:', sanitizeError(e));
    return [];
  }
};

/**
 * Mendapatkan data user secara langsung dari cloud
 */
export const fetchUsers = async (): Promise<ApprovalRequest[]> => {
  try {
    if (isMockMode) return [];
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    const list = await userRepository.fetchByTenant(tenantId, 500);
    return list.map((u) => ({
      id: u.uid,
      uid: u.uid,
      displayName: u.profile?.displayName || 'Tanpa Nama',
      email: u.profile?.email || '',
      role: (u.role as string) || 'user',
      idUnik: u.idUnik || '',
    }) as ApprovalRequest);
  } catch (err) {
    console.error('[userService] fetchUsers error:', err);
    return [];
  }
};

/**
 * Berlangganan real-time untuk semua data user
 */
export const subscribeUsers = (
  onUpdate: (users: ApprovalRequest[]) => void,
  onError?: (err: any) => void,
): (() => void) => {
  // UI should read from local Dexie. Real-time sync is handled by SyncEngine.
  // This is a stub to maintain compatibility.
  return () => {};
};

/**
 * Memperbarui data profil user dasar
 */
export const updateUser = async (uid: string, data: Partial<ApprovalRequest>): Promise<boolean> => {
  try {
    if (isMockMode) return true;

    const tenantId = useUserStore.getState().tenantId || 'global';
    const updatePayload = {
      ...data,
      updatedAt: Date.now(),
    };

    delete (updatePayload as any).uid;
    delete (updatePayload as any).id;

    const userData = await userRepository.findById(uid, tenantId);
    if (userData) {
      await userRepository.update({
        ...userData,
        ...deepClean(updatePayload),
        id: uid,
        updatedAt: Date.now(),
      } as any);
    } else {
      await userRepository.create({
        id: uid,
        tenantId: tenantId,
        ...deepClean(updatePayload),
        updatedAt: Date.now(),
      } as any);
    }

    publishUserEvent('USER_UPDATED', {
      uid,
      details: `Data user UID ${uid} diperbarui oleh admin`,
    });
    return true;
  } catch (err) {
    console.error('updateUser error:', sanitizeError(err));
    throw new Error(sanitizeError(err));
  }
};

/**
 * Menghapus user secara permanen
 */
export const deleteUser = async (uid: string): Promise<boolean> => {
  try {
    if (isMockMode) return true;

    const { deleteAccountByAdmin } = await import('./authService');
    const res = await deleteAccountByAdmin(uid);

    if (!res.success) {
      console.warn('API Delete failed, falling back to repository deletion:', res.error);
      const tenantId = useUserStore.getState().tenantId || 'global';
      await userRepository.delete(uid, tenantId);
    }

    publishUserEvent('USER_DELETED', {
      uid,
      details: `User UID ${uid} dihapus secara permanen`,
    });
    return true;
  } catch (err) {
    console.error('deleteUser error:', sanitizeError(err));
    throw new Error(sanitizeError(err));
  }
};

/**
 * Menolak pendaftaran akun (menyimpan status 'rejected')
 */
export const rejectPendingAccount = async (userId: string): Promise<boolean> => {
  try {
    if (isMockMode) return true;
    const tenantId = useUserStore.getState().tenantId || 'global';
    const existing = await userRepository.findById(userId, tenantId);
    if (existing) {
      await userRepository.update({ ...existing, status: 'rejected', updatedAt: Date.now() });
    }

    publishUserEvent('ACCOUNT_REJECTED', {
      userId,
      details: `Pendaftaran akun UID ${userId} ditolak oleh admin`,
    });
    return true;
  } catch (err) {
    console.error('rejectPendingAccount error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Menangguhkan/Menonaktifkan akun user (Suspended)
 */
export const suspendUser = async (userId: string, displayName: string): Promise<boolean> => {
  try {
    if (isMockMode) return true;
    const tenantId = useUserStore.getState().tenantId || 'global';
    const existing = await userRepository.findById(userId, tenantId);
    if (existing) {
      await userRepository.update({ ...existing, status: 'suspended', updatedAt: Date.now() });
    }

    publishUserEvent('ACCOUNT_SUSPENDED', {
      userId,
      displayName,
      details: `Akun ${displayName} (UID: ${userId}) ditangguhkan oleh admin`,
    });
    return true;
  } catch (err) {
    console.error('suspendUser error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Mengaktifkan kembali akun user yang ditangguhkan
 */
export const reactivateUser = async (userId: string, displayName: string): Promise<boolean> => {
  try {
    if (isMockMode) return true;
    const tenantId = useUserStore.getState().tenantId || 'global';
    const existing = await userRepository.findById(userId, tenantId);
    if (existing) {
      await userRepository.update({ ...existing, status: 'active', updatedAt: Date.now() });
    }

    publishUserEvent('ACCOUNT_REACTIVATED', {
      userId,
      displayName,
      details: `Akun ${displayName} (UID: ${userId}) diaktifkan kembali oleh admin`,
    });
    return true;
  } catch (err) {
    console.error('reactivateUser error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Mengaktifkan semua pengguna (bulk activate)
 */
export const activateAllUsers = async (): Promise<number> => {
  try {
    if (isMockMode) return 0;
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    const usersToActivate = await userRepository.fetchByTenant(tenantId, 1000);
    const filtered = usersToActivate.filter((u) => u.status !== 'active');
    if (filtered.length === 0) return 0;

    for (const u of filtered) {
      await userRepository.update({ ...u, status: 'active' as const, updatedAt: Date.now() });
    }

    publishUserEvent('BULK_USERS_ACTIVATED', {
      count: filtered.length,
      details: `Sebanyak ${filtered.length} akun diaktifkan secara massal oleh admin`,
    });

    return filtered.length;
  } catch (err) {
    console.error('activateAllUsers error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Mengambil data profil user tunggal secara optimal (Alias for getUserData)
 */
export const getUserProfile = async (uid: string): Promise<any | null> => {
  return getUserData(uid);
};

/**
 * Mengambil data profil user tunggal secara optimal
 */
export const getUserData = async (uid: string): Promise<any | null> => {
  try {
    if (isMockMode) return null;
    const tenantId = useUserStore.getState().tenantId || 'global';
    return await userRepository.findById(uid, tenantId);
  } catch (err) {
    console.error('getUserData error:', sanitizeError(err));
    return null;
  }
};

/**
 * Update Data User & Sinkronisasi Dokumen Siswa/Pendidik Induk
 */
export const updateUserDataAndSync = async (
  userId: string,
  updatedData: any,
  appClasses: any[] = [],
): Promise<boolean> => {
  try {
    if (isMockMode) return true;

    const tenantId = useUserStore.getState().tenantId || 'global';
    const matchingClass = appClasses.find((c: any) => c.name === (updatedData.tingkatRombel || ''));
    const classIdVal = matchingClass ? matchingClass.id : '';
    const classRefPath = matchingClass ? `classes/${matchingClass.id}` : '';

    const existingUser = await userRepository.findById(userId, tenantId);
    const resolvedRole = updatedData.role || existingUser?.role || (updatedData.studentsId || updatedData.nisn ? 'siswa' : 'tamu');

    const cleanUser: any = {
      displayName: updatedData.displayName || '',
      email: updatedData.email || '',
      phone: updatedData.phone || '',
      nisn: updatedData.nisn || '',
      nik: updatedData.nik || '',
      idUnik: updatedData.idUnik || '',
      studentsId: updatedData.studentsId || '',
      teachersId: updatedData.teachersId || '',
      tingkatRombel: updatedData.tingkatRombel || '',
      class: updatedData.tingkatRombel || '',
      role: resolvedRole,
    };

    if (classIdVal) {
      cleanUser.classId = classIdVal;
    }

    if (existingUser) {
      await userRepository.update({ ...existingUser, ...cleanUser, updatedAt: Date.now() });
    } else {
      await userRepository.create({ ...cleanUser, id: userId, tenantId: tenantId, updatedAt: Date.now() });
    }

    if (String(cleanUser.role).toLowerCase() === 'siswa') {
      const sId = cleanUser.studentsId || cleanUser.idUnik || cleanUser.nisn || userId;
      if (sId) {
        const sPayload: any = {
          id: sId,
          studentsId: sId,
          idUnik: sId,
          tenantId: tenantId,
          namaLengkap: cleanUser.displayName.toUpperCase(),
          email: cleanUser.email || '',
          noTelepon: cleanUser.phone || '',
          nisn: cleanUser.nisn || '',
          nik: cleanUser.nik || '',
          tingkatRombel: cleanUser.tingkatRombel || '',
          role: 'Siswa',
          isClaimed: true,
          linkedUserId: userId,
          authUid: userId,
          updatedAt: Date.now(),
        };
        if (classIdVal) {
          sPayload.classId = classIdVal;
          sPayload.classRef = classRefPath;
        }
        await studentRepository.update(sPayload);
      }
    } else if (cleanUser.teachersId) {
      const tId = cleanUser.teachersId;
      const tPayload: any = {
        id: tId,
        teachersId: tId,
        idUnik: tId,
        tenantId: tenantId,
        namaLengkap: cleanUser.displayName.toUpperCase(),
        email: cleanUser.email || '',
        noTelepon: cleanUser.phone || '',
        nip: updatedData.nip || '',
        nik: cleanUser.nik || '',
        role: cleanUser.role,
        isClaimed: true,
        linkedUserId: userId,
        authUid: userId,
        updatedAt: Date.now(),
      };
      await teacherRepository.update(tPayload);
    }

    publishUserEvent('USER_UPDATED', {
      uid: userId,
      category: 'AUTH',
      details: `Data user UID ${userId} diperbarui dan disinkronkan ke induk`,
    });
    return true;
  } catch (err) {
    console.error('updateUserDataAndSync error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Batch Update Users (Internal Admin Utility)
 */
export const bulkUpdateUsers = async (uids: string[], data: any): Promise<number> => {
  try {
    if (isMockMode || uids.length === 0) return 0;
    const tenantId = useUserStore.getState().tenantId || 'global';
    const usersToUpdate = await Promise.all(
      uids.map((uid) => userRepository.findById(uid, tenantId)),
    );
    const validUsers = usersToUpdate.filter((u): u is any => u !== null);

    const updatedUsers = validUsers.map((u) => ({
      ...u,
      ...data,
      updatedAt: Date.now(),
    }));

    for (const u of updatedUsers) {
      await userRepository.update(u);
    }

    return uids.length;
  } catch (err) {
    console.error('bulkUpdateUsers error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Menolak pengajuan data (profile update request)
 */
export const rejectProfileUpdateRequest = async (reqId: string): Promise<boolean> => {
  try {
    if (isMockMode) return true;
    const tenantId = useUserStore.getState().tenantId || 'global';
    const req = await profileRequestRepository.findById(reqId, tenantId);
    if (req) {
      await profileRequestRepository.update({
        ...req,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
      });
    }

    publishUserEvent('PROFILE_UPDATE_REJECTED', {
      reqId,
      details: `Pengajuan upgrade profil ID ${reqId} ditolak`,
    });
    return true;
  } catch (err) {
    console.error('rejectProfileUpdateRequest error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Update Profile Pengguna dan sinkronisasi ke koleksi Siswa/Guru secara atomis
 * serta mengupdate profile Firebase Auth (displayName).
 */
export const updateFullProfileAndAuth = async (
  userId: string,
  updatedData: any,
  isStudent: boolean,
  authDisplayName?: string,
): Promise<boolean> => {
  try {
    if (isMockMode) return true;
    const tenantId = useUserStore.getState().tenantId || 'global';

    // 1. Update User
    const existingUser = await userRepository.findById(userId, tenantId);
    const userPayload: any = { 
      ...existingUser,
      ...updatedData,
      updatedAt: Date.now() 
    };
    delete userPayload.uid;
    // id is handled by repository.save
    await userRepository.update({ ...userPayload, id: userId, tenantId });

    // 2. Update Student/Teacher if applicable
    const sId =
      updatedData.studentsId ||
      updatedData.studentId ||
      (isStudent ? updatedData.id || userId : null);
    const tId =
      updatedData.teachersId ||
      updatedData.teacherId ||
      (!isStudent ? updatedData.id || userId || updatedData.referenceId : null);

    if (isStudent && sId) {
      const existingStudent = await studentRepository.findById(sId, tenantId);
      const studentPayload: any = { ...existingStudent };
      
      if (updatedData.displayName || updatedData.namaLengkap)
        studentPayload.namaLengkap = updatedData.displayName || updatedData.namaLengkap;
      if (updatedData.email !== undefined) studentPayload.email = updatedData.email;
      if (updatedData.nik !== undefined) studentPayload.nik = updatedData.nik;
      if (updatedData.nisn !== undefined) studentPayload.nisn = updatedData.nisn;
      if (updatedData.tingkatRombel !== undefined)
        studentPayload.tingkatRombel = updatedData.tingkatRombel;

      // Handle nested fields for kontakDanWali
      if (!studentPayload.kontakDanWali) studentPayload.kontakDanWali = {};
      
      if (updatedData.phone || updatedData.noTelepon || updatedData.nomorHpSiswa)
        studentPayload.kontakDanWali.nomorHpSiswa = updatedData.phone || updatedData.noTelepon || updatedData.nomorHpSiswa;
      if (updatedData.address || updatedData.alamat || updatedData.alamatRumah)
        studentPayload.kontakDanWali.alamatRumah = updatedData.address || updatedData.alamat || updatedData.alamatRumah;
      
      if (updatedData.namaWali) studentPayload.kontakDanWali.namaWali = updatedData.namaWali;
      if (updatedData.hubunganWali) studentPayload.kontakDanWali.hubunganWali = updatedData.hubunganWali;
      if (updatedData.nomorHpWaliWhatsApp) studentPayload.kontakDanWali.nomorHpWaliWhatsApp = updatedData.nomorHpWaliWhatsApp;

      // Handle other fields
      if (updatedData.namaAyah) studentPayload.namaAyah = updatedData.namaAyah;
      if (updatedData.namaIbu) studentPayload.namaIbu = updatedData.namaIbu;
      if (updatedData.tempatLahir) studentPayload.tempatLahir = updatedData.tempatLahir;
      if (updatedData.tanggalLahir) studentPayload.tanggalLahir = updatedData.tanggalLahir;

      await studentRepository.update({ ...studentPayload, id: sId, tenantId });
    } else if (!isStudent && tId) {
      const existingTeacher = await teacherRepository.findById(tId, tenantId);
      const teacherPayload: any = { ...existingTeacher };

      if (updatedData.displayName || updatedData.namaLengkap)
        teacherPayload.namaLengkap = updatedData.displayName || updatedData.namaLengkap;
      if (updatedData.email !== undefined) teacherPayload.email = updatedData.email;
      if (updatedData.phone || updatedData.noTelepon)
        teacherPayload.noTelepon = updatedData.phone || updatedData.noTelepon;
      if (updatedData.nik !== undefined) teacherPayload.nik = updatedData.nik;
      if (updatedData.nip !== undefined) teacherPayload.nip = updatedData.nip;
      if (updatedData.alamat || updatedData.address)
        teacherPayload.alamat = updatedData.alamat || updatedData.address;

      await teacherRepository.update({ ...teacherPayload, id: tId, tenantId });
    }

    // 3. Update Auth Profile
    const currentUser = authGateway.getCurrentUser();
    if (currentUser && authDisplayName) {
      await authGateway.updateProfile(currentUser, {
        displayName: authDisplayName,
      });
    }

    publishUserEvent('USER_UPDATED', {
      uid: userId,
      details: `Profil lengkap UID ${userId} diperbarui.`,
    });
    return true;
  } catch (err) {
    console.error('updateFullProfileAndAuth error:', sanitizeError(err));
    throw new Error(sanitizeError(err));
  }
};

/**
 * Hapus permanen pengajuan data update
 */
export const deleteProfileUpdateRequest = async (reqId: string): Promise<boolean> => {
  try {
    if (isMockMode) return true;
    const tenantId = useUserStore.getState().tenantId || 'global';
    await profileRequestRepository.delete(reqId, tenantId);
    return true;
  } catch (err) {
    console.error('deleteProfileUpdateRequest error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Menyetujui perubahan data (profile update request)
 */
export const approveProfileUpdateRequest = async (
  reqId: string,
  studentId: string,
  userId: string,
  changes: any,
  approvedBy: string = 'Admin',
): Promise<boolean> => {
  try {
    if (isMockMode) return true;

    const tenantId = useUserStore.getState().tenantId || 'global';
    const reqSnap = await profileRequestRepository.findById(reqId, tenantId);
    if (!reqSnap) {
      throw new Error('Pengajuan pembaruan profil tidak ditemukan.');
    }

    const targetCollection = reqSnap.targetCollection || 'students';
    const refId = reqSnap.referenceId || studentId || (reqSnap as any).studentsId || (reqSnap as any).studentId;
    const uId = reqSnap.userId || userId;
    const newData = reqSnap.newData || {};

    const updates: { collection: string; id: string; data: any }[] = [];

    if (targetCollection === 'students' && refId) {
      const studentUpdatePayload: any = {
        ...newData,
        studentsId: refId,
        idUnik: refId,
        
        statusAktif: true,
        approvalStatus: 'approved',
        sistemJangkar: {
          tenantId: reqSnap.tenantId,
          userId: uId,
          diperbaruiPada: new Date().toISOString(),
          diperbaruiOleh: `Approved by ${approvedBy}`,
        },
      };
      updates.push({ collection: 'students', id: refId, data: studentUpdatePayload });

      if (uId) {
        const userUpdatePayload: any = {
          studentsId: refId,
          referenceId: refId,
          
          
          approvalStatus: 'approved',
        };
        if (newData.namaLengkap || newData.displayName) {
          userUpdatePayload.displayName = newData.namaLengkap || newData.displayName;
        }
        updates.push({ collection: 'users', id: uId, data: userUpdatePayload });
      }
    } else if (targetCollection === 'teachers' && refId) {
      const teacherUpdatePayload = {
        ...newData,
        teacherId: refId,
        
        statusAktif: true,
        approvalStatus: 'approved',
        sistemJangkar: {
          tenantId: reqSnap.tenantId || 'default',
          userId: uId,
          diperbaruiPada: new Date().toISOString(),
          diperbaruiOleh: `Approved by ${approvedBy}`,
        },
      };
      updates.push({ collection: 'teachers', id: refId, data: teacherUpdatePayload });

      if (uId) {
        const userUpdatePayload: any = {
          teachersId: refId,
          referenceId: refId,
          
          
          approvalStatus: 'approved',
        };
        if (newData.namaLengkap) {
          userUpdatePayload.displayName = newData.namaLengkap;
        }
        updates.push({ collection: 'users', id: uId, data: userUpdatePayload });
      }
    } else if (targetCollection === 'users' && uId) {
      updates.push({ collection: 'users', id: uId, data: newData });
    }

    const req = await profileRequestRepository.findById(reqId, tenantId);
    if (req) {
      await profileRequestRepository.update({
        ...req,
        ...updates,
        status: 'approved',
        approvedBy,
        reviewNotes: 'Disetujui secara otomatis oleh sistem administrasi',
        approvedAt: new Date().toISOString(),
      });
    }

    publishUserEvent('PROFILE_UPDATE_APPROVED', {
      reqId,
      details: `Perubahan data untuk pengajuan ID ${reqId} disetujui`,
    });

    return true;
  } catch (err) {
    console.error('approveProfileUpdateRequest error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Merevisi pengajuan data (profile update request) yang belum disetujui
 */
export const reviseProfileUpdateRequest = async (
  reqId: string,
  requestedChanges: any,
): Promise<boolean> => {
  try {
    if (isMockMode) return true;
    const tenantId = useUserStore.getState().tenantId || 'global';
    const req = await profileRequestRepository.findById(reqId, tenantId);
    if (req) {
      await profileRequestRepository.update({ ...req, requestedChanges } as any);
    }
    return true;
  } catch (err) {
    console.error('reviseProfileUpdateRequest error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Mengajukan perubahan data pokok siswa
 */
export const submitProfileUpdateRequest = async (
  userId: string,
  referenceId: string,
  displayName: string,
  nisn: string,
  requestedChanges: any,
  tenantId: string = '30315537',
  entityType: 'student' | 'teacher' | 'user' = 'student',
  targetCollection: 'users' | 'students' | 'teachers' = 'students',
): Promise<boolean> => {
  try {
    if (isMockMode) return true;

    const now = new Date();
    const requestId = `${tenantId || 'global'}_${userId}_${now.getTime()}`;

    const requestDoc: any = {
      id: requestId,
      tenantId,
      userId,
      entityType,
      targetCollection,
      referenceId,
      
      newData: requestedChanges,
      submittedAt: now.toISOString(),
      displayName,
      nisn: nisn || '',
      requestedChanges: requestedChanges,
    };

    await profileRequestRepository.create({
      ...requestDoc,
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    } as any);

    publishUserEvent('PROFILE_UPDATE_SUBMITTED', {
      reqId: requestId,
      displayName,
      targetCollection,
      referenceId,
      details: `Pengguna ${displayName} mengajukan perubahan data untuk koleksi ${targetCollection} (${referenceId})`,
    });

    return true;
  } catch (err) {
    console.error('submitProfileUpdateRequest error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Repair/Synchronize referenceId for users based on Enterprise Identity Architecture.
 * Ensures referenceId ALWAYS points to master entity primary ID (students.id / teachers.id),
 * normalizes NISN/NIP pointers, and detects cross-tenant violations.
 */
export const repairUserReferenceIds = async (
  targetRole?: string,
): Promise<{ fixed: number; total: number; crossTenantViolations: number }> => {
  try {
    if (isMockMode) return { fixed: 0, total: 0, crossTenantViolations: 0 };
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    const snapshots = await userRepository.fetchByTenant(tenantId, 1000);
    if (snapshots.length === 0) return { fixed: 0, total: 0, crossTenantViolations: 0 };

    let fixedCount = 0;
    let crossTenantViolations = 0;

    for (const data of snapshots) {
      const uid = data.id || data.uid;
      const userTenantId = data.tenantId || tenantId;

      const roleStr = String(data.role || data.accountType || '').toLowerCase();
      const isStudent = ['siswa', 'ketua_kelas', 'student'].includes(roleStr);
      const isTeacher = ['guru', 'wali_kelas', 'guru_bk', 'gtk', 'staf', 'teacher'].includes(
        roleStr,
      );

      let targetRefId: string | null = null;
      let targetStudentsId: string | null = null;
      let targetTeachersId: string | null = null;

      if (isStudent) {
        let student = await studentRepository.findById(data.studentsId || data.referenceId || '', userTenantId);
        if (!student) {
          student = await studentRepository.fetchByIdUnik(userTenantId, data.idUnik || data.nisn || data.referenceId || '');
        }

        if (student) {
          if (student.tenantId && student.tenantId !== userTenantId) {
            console.warn(`[SECURITY_VIOLATION] User ${uid} tenant (${userTenantId}) mismatch with Student master tenant (${student.tenantId}). Unlinking.`);
            crossTenantViolations++;
            targetRefId = null;
            targetStudentsId = null;
          } else {
            targetRefId = student.id;
            targetStudentsId = student.id;
            // Update master entity linkage
            if (!(student as any).linked || (student as any).userId !== uid) {
              await studentRepository.update({
                ...student,
                linked: true,
                userId: uid,
                linkedAt: Date.now(),
              } as any);
            }
          }
        } else {
          // Unlink invalid reference if no student found
          targetRefId = null;
          targetStudentsId = null;
        }
      } else if (isTeacher) {
        let teacher = await teacherRepository.findById(data.teachersId || data.referenceId || '', userTenantId);
        if (!teacher) {
          teacher = await teacherRepository.fetchByIdUnik(userTenantId, data.idUnik || data.nip || data.nik || data.referenceId || '');
        }

        if (teacher) {
          if (teacher.tenantId && teacher.tenantId !== userTenantId) {
            console.warn(`[SECURITY_VIOLATION] User ${uid} tenant (${userTenantId}) mismatch with Teacher master tenant (${teacher.tenantId}). Unlinking.`);
            crossTenantViolations++;
            targetRefId = null;
            targetTeachersId = null;
          } else {
            targetRefId = teacher.id;
            targetTeachersId = teacher.id;
            // Update master entity linkage
            if (!(teacher as any).linked || (teacher as any).userId !== uid) {
              await teacherRepository.update({
                ...teacher,
                linked: true,
                userId: uid,
                linkedAt: Date.now(),
              } as any);
            }
          }
        } else {
          targetRefId = null;
          targetTeachersId = null;
        }
      } else {
        // Non-student, non-teacher user: clear any invalid NISN/NIP referenceId
        if (data.referenceId && (data.referenceId === data.idUnik || data.referenceId === uid)) {
          targetRefId = null;
        } else {
          targetRefId = data.referenceId || null;
        }
      }

      if (
        data.referenceId !== targetRefId ||
        data.studentsId !== targetStudentsId ||
        data.teachersId !== targetTeachersId
      ) {
        await userRepository.update({
          ...data,
          referenceId: targetRefId,
          studentsId: targetStudentsId,
          teachersId: targetTeachersId,
          updatedAt: Date.now(),
        });
        fixedCount++;
      }
    }

    if (fixedCount > 0 || crossTenantViolations > 0) {
      publishUserEvent('REFERENCE_IDS_REPAIRED', {
        count: fixedCount,
        crossTenantViolations,
        details: `Sinkronisasi referenceId dilakukan untuk ${fixedCount} user, mendeteksi ${crossTenantViolations} pelanggaran cross-tenant.`,
      });

      await auditLog({
        action: 'REFERENCE_ID_NORMALIZATION',
        category: 'SECURITY',
        details: `Disinkronkan ${fixedCount} user referenceId, ${crossTenantViolations} pelanggaran batas tenant terdeteksi.`,
        schoolId: tenantId,
      });
    }

    return { fixed: fixedCount, total: snapshots.length, crossTenantViolations };
  } catch (err) {
    console.error('repairUserReferenceIds error:', err);
    throw new Error(sanitizeError(err));
  }
};

/**
 * Link student identity securely via Dexie repositories (Offline-First compliant)
 */
export const linkStudentId = async (userUid: string, cleanId: string, tenantId: string) => {
  try {
    // 1. Check if idUnik is already used by another user
    const existingUsers = await userRepository.findAll(tenantId);
    const conflict = existingUsers.find((u) => u.idUnik === cleanId && u.id !== userUid);
    if (conflict) {
      throw new Error('idUnik ini sudah terhubung dengan akun lain. Periksa kembali ID Anda.');
    }

    // 2. Check student record in studentRepository
    let student = await studentRepository.fetchByIdUnik(tenantId, cleanId);
    if (!student) {
      student = await studentRepository.findById(cleanId, tenantId);
    }
    if (!student) {
      throw new Error('idUnik tidak ditemukan. Periksa kembali data Anda.');
    }

    if (student.tenantId && student.tenantId !== tenantId) {
      throw new Error('Pelanggaran batas tenant: Data siswa berada di madrasah berbeda.');
    }

    const studentDocId = student.id;

    // 3. Update student record
    await studentRepository.update({
      ...student,
      id: studentDocId,
      userId: userUid,
      isLinked: true,
      linked: true,
      isClaimed: true,
      linkedAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    // 4. Update user record with referenceId = student.id
    const currentUser = (await userRepository.findById(userUid, tenantId)) || { id: userUid, uid: userUid };
    await userRepository.update({
      ...currentUser,
      id: userUid,
      uid: userUid,
      referenceId: studentDocId, // Correct contract: studentDocId
      studentsId: studentDocId,
      idUnik: cleanId,
      tenantId: tenantId,
      isClaimed: true,
      status: 'active',
      accountStatus: 'active',
      linked: true,
      linkedAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    await auditLog({
      action: 'MANUAL_LINK_STUDENT',
      category: 'USER',
      details: `User ${userUid} berhasil dihubungkan dengan siswa ${studentDocId}`,
      schoolId: tenantId,
    });

    return { studentDocId };
  } catch (err: any) {
    console.error('linkStudentId error:', err);
    throw new Error(sanitizeError(err));
  }
};

export const userService = {
  fetchPendingAccountRegistrations,
  approveAccountRequest,
  rejectAccountRequest,
  fetchPendingApprovals,
  subscribePendingApprovals,
  fetchUsersByQuery,
  fetchUsers,
  subscribeUsers,
  updateUser,
  deleteUser,
  rejectPendingAccount,
  suspendUser,
  reactivateUser,
  activateAllUsers,
  getUserProfile,
  getUserData,
  updateUserDataAndSync,
  bulkUpdateUsers,
  rejectProfileUpdateRequest,
  updateFullProfileAndAuth,
  deleteProfileUpdateRequest,
  approveProfileUpdateRequest,
  reviseProfileUpdateRequest,
  submitProfileUpdateRequest,
  repairUserReferenceIds,
  linkStudentId,
};


export const getUsersByTenant = async (tenantId: string): Promise<any[]> => {
  try {
    return await userRepository.fetchByTenant(tenantId, 500);
  } catch (e) {
    console.error('Error fetching users for tenant', e);
    return [];
  }
};

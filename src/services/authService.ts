/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: AUTHENTICATION SERVICE
 */

import axios from 'axios';
import { isMockMode, getFriendlyErrorMessage, isReadOnly, handleFirestoreError, OperationType, safeStringify } from './firebase';
export { handleFirestoreError, OperationType, safeStringify };
import { auditLog } from './auditLogService';
import { UserRole } from '@/types';
import { authGateway } from './auth/AuthGateway';
import { sanitizeError } from '@/utils/firestoreHelpers';
import { incrementMasterVersion } from './schemaRepairService';
import { localDb } from '@/database/dexie';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import { userRepository } from '@/repositories/userRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import { authRepository } from '@/repositories/AuthRepository';
import { FirebaseUserSyncService } from './sync/FirebaseUserSyncService';
import { normalizeRoleStr as normalizeRoleStrUtil } from '@/utils/roleNormalizer';
import { SecurityContextService } from '@/core/security/SecurityContextService';

export const getCurrentUser = () => authGateway.getCurrentUser();
export const getCurrentIdToken = () => authGateway.getCurrentUser()?.getIdToken();
export const onAuthStateChanged = (callback: (user: any) => void) => authGateway.onAuthStateChanged(callback);

export const logout = async (): Promise<void> => {
  try {
    if (!isMockMode) {
      await auditLog({ action: 'LOGOUT', category: 'SECURITY', details: 'User logged out' });
      await authGateway.signOut();
    }
  } finally {
    SecurityContextService.clear();
    SecurityContextService.setLifecycleState('SIGNED_OUT');
  }
};
export const logoutUser = logout;

export const initializeSession = async (firebaseUser: any): Promise<{ success: boolean; status: string; user?: any }> => {
  if (!firebaseUser) {
    SecurityContextService.clear();
    SecurityContextService.setLifecycleState('SIGNED_OUT');
    return { success: false, status: 'unauthenticated' };
  }

  try {
    // Firebase authentication has succeeded; no authorization is granted yet.
    SecurityContextService.setLifecycleState('AUTHENTICATED');

    // Canonical identity resolution is the only source allowed to establish
    // tenant, referenceId, accountType and roles.
    const canonicalUser = await FirebaseUserSyncService.syncAuthUser(firebaseUser);
    if (!canonicalUser) throw new Error('CANONICAL_USER_RESOLUTION_FAILED');

    if (canonicalUser.status === 'pending') {
      useAuthStore.getState().setUser(canonicalUser);
      useAuthStore.getState().setAccountStatus('pending');
      SecurityContextService.clear();
      return { success: true, status: 'pending', user: canonicalUser };
    }

    if (canonicalUser.status === 'suspended' || canonicalUser.status === 'inactive') {
      SecurityContextService.clear();
      SecurityContextService.setLifecycleState('ERROR', `ACCOUNT_${String(canonicalUser.status).toUpperCase()}`);
      return { success: false, status: canonicalUser.status };
    }

    // The service is the sole runtime write path for SecurityContext.
    SecurityContextService.initialize(canonicalUser as any);
    SecurityContextService.setLifecycleState('READY');

    // Stores receive a projection for UI compatibility. They never establish
    // or authorize the runtime SecurityContext.
    useAuthStore.getState().setUser(canonicalUser);
    useAuthStore.getState().setAccountStatus(canonicalUser.status);
    useUserStore.getState().setUserData({ uid: canonicalUser.uid, role: canonicalUser.role, roles: canonicalUser.roles, tenantId: canonicalUser.tenantId, referenceId: canonicalUser.referenceId, status: canonicalUser.status } as any);
    useProfileStore.getState().setProfile({ uid: canonicalUser.uid, email: canonicalUser.profile?.email || canonicalUser.email || '', displayName: canonicalUser.profile?.displayName || canonicalUser.displayName || '', photoURL: canonicalUser.profile?.photoURL || canonicalUser.photoURL || null });

    return { success: true, status: 'active', user: canonicalUser };
  } catch (error) {
    SecurityContextService.clear();
    SecurityContextService.setLifecycleState('ERROR', error instanceof Error ? error : String(error));
    console.error('[AuthService] Session initialization failed:', error);
    return { success: false, status: 'error' };
  }
};

export { isMockMode, getFriendlyErrorMessage, isReadOnly };

export const hashPassword = async (password: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const registerAndClaimAccount = async (email: string, password: string, masterId: string, type: 'student' | 'teacher', masterData: any): Promise<{ success: boolean; role: UserRole; message?: string }> => {
  try {
    const userCredential = await authGateway.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const role = type === 'student' ? UserRole.SISWA : ((masterData.role || UserRole.GURU) as UserRole);
    const tenantId = String(masterData.tenantId || masterData.sistemJangkar?.tenantId || '').trim();
    if (!tenantId || ['global', 'default', 'unknown', 'system'].includes(tenantId.toLowerCase())) throw new Error('Tenant canonical tidak ditemukan.');
    const userDoc: any = { uid: user.uid, displayName: masterData.namaLengkap || masterData.nama || masterData.name || 'Pengguna', email: user.email, role, roles: [role], tenantId, referenceId: masterId, studentsId: type === 'student' ? masterId : '', teachersId: type === 'teacher' ? masterId : '', idUnik: masterId, accountType: type, isClaimed: true, status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isSso: false };
    const cleanUserDoc: any = { id: user.uid };
    Object.keys(userDoc).forEach((key) => { const val = userDoc[key]; if (val !== undefined && val !== null) cleanUserDoc[key] = val; });
    await userRepository.update(cleanUserDoc);
    if (type === 'student') await studentRepository.update({ id: masterId, linked: true, userId: user.uid, linkedAt: Date.now() } as any);
    else await teacherRepository.update({ id: masterId, linked: true, userId: user.uid, linkedAt: Date.now() } as any);
    const session = await initializeSession(user);
    if (!session.success) throw new Error(`Gagal inisialisasi sesi setelah registrasi: ${session.status}`);
    return { success: true, role };
  } catch (e: any) {
    return { success: false, role: UserRole.GURU, message: e.message };
  }
};

export const watchUserDoc = (uid: string, callback: (data: any) => void, errorCallback?: (error: any) => void) => {
  localDb.users.get(uid).then((local) => callback(local || null));
  return () => {};
};

export const attemptAutoLinkStudent = async (uid: string, email: string, tenantId: string): Promise<any | null> => {
  try {
    if (!tenantId || ['global', 'default', 'unknown', 'system'].includes(tenantId.toLowerCase())) return null;
    const students = await studentRepository.findAll(tenantId);
    const studentData = students.find(s => s.email?.toLowerCase() === email.toLowerCase() && !(s as any).linked);
    if (!studentData) return null;
    const studentDocId = studentData.id;
    const tenantIdStr = studentData.tenantId || tenantId;
    await studentRepository.update({ ...studentData, userId: uid, linked: true, isClaimed: true, linkedAt: Date.now(), updatedAt: Date.now() } as any);
    const user = await userRepository.findById(uid, tenantIdStr);
    if (user) await userRepository.update({ ...user, referenceId: studentDocId, studentsId: studentDocId, isClaimed: true, tenantId: tenantIdStr, status: 'active', accountStatus: 'active', updatedAt: Date.now() } as any);
    await auditLog({ action: 'AUTO_LINK_STUDENT', category: 'AUTH', details: `Auto-linked UID ${uid} to student master ID ${studentDocId}`, schoolId: tenantIdStr });
    return { ...studentData, id: studentDocId };
  } catch (e) { console.error('[authService] attemptAutoLinkStudent error:', e); return null; }
};

export const getMasterProfile = async (uid: string, accountType: string, refId: string): Promise<any | null> => {
  try {
    const context = SecurityContextService.getContext();
    if (context.uid !== uid) throw new Error('Security context UID mismatch.');
    const tenantId = context.tenantId;
    if (accountType === 'student') return await studentRepository.findById(refId, tenantId) || await studentRepository.fetchByUserId(tenantId, uid);
    return await teacherRepository.findById(refId, tenantId) || await teacherRepository.findByUserId(tenantId, uid);
  } catch (e: any) { console.error('[authService] getMasterProfile error:', e); return null; }
};

export const ensureUserDoc = async (uid: string, email: string, displayName: string): Promise<any> => FirebaseUserSyncService.syncAuthUser({ uid, email, displayName });

/** Compatibility export only; interactive provider authentication is disabled. */
export const loginWithGoogle = async (): Promise<{ success: boolean; role?: UserRole; error?: string; isNotRegistered?: boolean }> => ({ success: false, error: 'Google login dinonaktifkan. Gunakan login email/password.' });

export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
  if (isMockMode) return { success: true, message: 'Email reset password telah dikirim (Simulasi).' };
  try { await authGateway.sendPasswordResetEmail(email); return { success: true, message: 'Email reset password telah dikirim ke alamat email Anda.' }; }
  catch (e: any) { let message = 'Gagal mengirim email reset password.'; if (e.code === 'auth/user-not-found') message = 'Email tidak terdaftar.'; if (e.code === 'auth/invalid-email') message = 'Format email tidak valid.'; return { success: false, message }; }
};

export const normalizeRoleStr = (roleStr: any, email?: string): UserRole => (normalizeRoleStrUtil(roleStr, email || authGateway.getCurrentUser()?.email || undefined) as UserRole) || UserRole.TAMU;

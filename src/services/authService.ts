/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: AUTHENTICATION SERVICE
 */

import axios from 'axios';
import {
  isMockMode,
  getFriendlyErrorMessage,
  isReadOnly,
  handleFirestoreError,
  OperationType,
  safeStringify,
} from './firebase';

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
import { SecurityContext } from '@/core/security/SecurityContext';
import { AuthenticationContext, IdentityContext } from '@/core/identity/security-context/SecurityContext.types';
import { FirebaseUserSyncService } from './sync/FirebaseUserSyncService';
import { normalizeRoleStr as normalizeRoleStrUtil } from '@/utils/roleNormalizer';
import { SecurityContextBuilder } from '@/core/identity/security-context/SecurityContextBuilder';
import { LegacyUserAdapter } from '@/core/identity/adapters/LegacyUserAdapter';

export const getCurrentUser = () => authGateway.getCurrentUser();
export const getCurrentIdToken = () => authGateway.getCurrentUser()?.getIdToken();
export const onAuthStateChanged = (callback: (user: any) => void) => authGateway.onAuthStateChanged(callback);

export const logout = async (): Promise<void> => {
  if (isMockMode) return;
  try {
    await auditLog({ action: 'LOGOUT', category: 'SECURITY', details: `User logged out` });
    await authGateway.signOut();
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
    throw error;
  }
};

export const logoutUser = logout;

/**
 * PHASE 2: Identity & Authentication Initialization
 * Bangun context aplikasi dari CanonicalUser.
 */
export const initializeSession = async (firebaseUser: any): Promise<{ success: boolean; status: string; user?: any }> => {
  if (!firebaseUser) return { success: false, status: 'unauthenticated' };

  try {
    const canonicalUser = await FirebaseUserSyncService.syncAuthUser(firebaseUser);
    if (!canonicalUser) return { success: false, status: 'error_sync' };

    if (canonicalUser.status === 'pending') {
      useAuthStore.getState().setUser(canonicalUser);
      useAuthStore.getState().setAccountStatus('pending');
      return { success: true, status: 'pending', user: canonicalUser };
    }

    if (canonicalUser.status === 'suspended' || canonicalUser.status === 'inactive') {
      return { success: false, status: canonicalUser.status };
    }

    const authContext: AuthenticationContext = {
      uid: canonicalUser.uid,
      email: canonicalUser.email || '',
      provider: 'password',
      isAuthenticated: true,
    };

    const identityContext: IdentityContext = {
      user: canonicalUser,
      assignment: {
        referenceId: canonicalUser.referenceId || undefined,
        tenantId: canonicalUser.tenantId || '',
        portal: canonicalUser.tenantId ? 'madrasah' : 'public',
        status: canonicalUser.status || 'aktif',
      },
    };

    SecurityContextBuilder.build(authContext, identityContext);

    useAuthStore.getState().setUser(canonicalUser);
    useAuthStore.getState().setAccountStatus(canonicalUser.status);

    useUserStore.getState().setUserData({
      uid: canonicalUser.uid,
      role: canonicalUser.role,
      roles: canonicalUser.roles,
      tenantId: canonicalUser.tenantId,
      referenceId: canonicalUser.referenceId,
      status: canonicalUser.status,
    } as any);

    useProfileStore.getState().setProfile({
      uid: canonicalUser.uid,
      email: canonicalUser.profile?.email || canonicalUser.email || '',
      displayName: canonicalUser.profile?.displayName || canonicalUser.displayName || '',
      photoURL: canonicalUser.profile?.photoURL || canonicalUser.photoURL || null,
    });

    return { success: true, status: 'active', user: canonicalUser };
  } catch (error) {
    console.error('[AuthService] Session initialization failed:', error);
    return { success: false, status: 'error' };
  }
};

export { isMockMode, getFriendlyErrorMessage, isReadOnly };

const getSystemContext = (tenantId = 'default', uid = 'SYSTEM'): SecurityContext => new SecurityContext(
  uid,
  tenantId,
  new Set<any>(['*']),
  { isGlobalTenantAccess: true },
  [UserRole.DEVELOPER],
  'developer'
);

export const hashPassword = async (password: string): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const registerAndClaimAccount = async (
  email: string,
  password: string,
  masterId: string,
  type: 'student' | 'teacher',
  masterData: any,
): Promise<{ success: boolean; role: UserRole; message?: string }> => {
  try {
    const userCredential = await authGateway.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const role = type === 'student' ? UserRole.SISWA : ((masterData.role || UserRole.GURU) as UserRole);
    const tenantId = masterData.tenantId || masterData.sistemJangkar?.tenantId;

    const userDoc: any = {
      uid: user.uid,
      displayName: masterData.namaLengkap || masterData.nama || masterData.name || 'Pengguna',
      email: user.email,
      role,
      roles: [role],
      tenantId,
      referenceId: masterId,
      studentsId: type === 'student' ? masterId : '',
      teachersId: type === 'teacher' ? masterId : '',
      idUnik: masterId,
      accountType: type,
      isClaimed: true,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSso: false,
    };

    const cleanUserDoc: any = { id: user.uid };
    Object.keys(userDoc).forEach((key) => {
      const val = userDoc[key];
      if (val !== undefined && val !== null) cleanUserDoc[key] = val;
    });

    getSystemContext(tenantId, user.uid);
    await userRepository.update(cleanUserDoc);

    if (type === 'student') {
      await studentRepository.update({ id: masterId, linked: true, userId: user.uid, linkedAt: Date.now() } as any);
    } else {
      await teacherRepository.update({ id: masterId, linked: true, userId: user.uid, linkedAt: Date.now() } as any);
    }

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

export const attemptAutoLinkStudent = async (uid: string, email: string, tenantId: string = 'default'): Promise<any | null> => {
  try {
    const students = await studentRepository.findAll(tenantId);
    const studentData = students.find(s => s.email?.toLowerCase() === email.toLowerCase() && !(s as any).linked);
    if (!studentData) return null;

    const studentDocId = studentData.id;
    const tenantIdStr = studentData.tenantId || tenantId;
    await studentRepository.update({ ...studentData, userId: uid, linked: true, isClaimed: true, linkedAt: Date.now(), updatedAt: Date.now() } as any);
    const user = await userRepository.findById(uid, tenantIdStr);
    if (user) {
      await userRepository.update({ ...user, referenceId: studentDocId, studentsId: studentDocId, isClaimed: true, tenantId: tenantIdStr, status: 'active', accountStatus: 'active', updatedAt: Date.now() } as any);
    }
    await auditLog({ action: 'AUTO_LINK_STUDENT', category: 'AUTH', details: `Auto-linked UID ${uid} to student master ID ${studentDocId}`, schoolId: tenantIdStr });
    return { ...studentData, id: studentDocId };
  } catch (e) {
    console.error('[authService] attemptAutoLinkStudent error:', e);
    return null;
  }
};

export const getMasterProfile = async (uid: string, accountType: string, refId: string): Promise<any | null> => {
  try {
    const tenantId = useUserStore.getState().tenantId || 'global';
    if (accountType === 'student') {
      let student = await studentRepository.findById(refId, tenantId);
      if (!student) student = await studentRepository.fetchByUserId(tenantId, uid);
      return student;
    }
    let teacher = await teacherRepository.findById(refId, tenantId);
    if (!teacher) teacher = await teacherRepository.findByUserId(tenantId, uid);
    return teacher;
  } catch (e: any) {
    console.error('[authService] getMasterProfile error:', e);
    return null;
  }
};

export const ensureUserDoc = async (uid: string, email: string, displayName: string): Promise<any> => {
  return await FirebaseUserSyncService.syncAuthUser({ uid, email, displayName });
};

/**
 * Google authentication is intentionally disabled. The canonical login surface
 * is email/password through loginWithIdentifier(). Keeping a compatibility
 * export avoids breaking legacy imports without retaining a provider surface.
 */
export const loginWithGoogle = async (): Promise<{ success: boolean; role?: UserRole; error?: string; isNotRegistered?: boolean }> => ({
  success: false,
  error: 'Google login dinonaktifkan. Gunakan login email/password.',
});

export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
  if (isMockMode) return { success: true, message: 'Email reset password telah dikirim (Simulasi).' };
  try {
    await authGateway.sendPasswordResetEmail(email);
    return { success: true, message: 'Email reset password telah dikirim ke alamat email Anda.' };
  } catch (e: any) {
    let message = 'Gagal mengirim email reset password.';
    if (e.code === 'auth/user-not-found') message = 'Email tidak terdaftar.';
    if (e.code === 'auth/invalid-email') message = 'Format email tidak valid.';
    return { success: false, message };
  }
};

export const normalizeRoleStr = (roleStr: any, email?: string): UserRole => {
  const resolved = normalizeRoleStrUtil(roleStr, email || authGateway.getCurrentUser()?.email || undefined);
  return (resolved as UserRole) || UserRole.TAMU;
};

const handleAccountActivation = async (identifier: string, idNormalized: string, idLower: string, password: string) => {
  const student = await studentRepository.fetchByIdUnik('default', identifier)
    || await studentRepository.fetchByIdUnik('default', idNormalized)
    || await studentRepository.fetchByIdUnik('default', idLower);

  let teacher: any = null;
  if (!student) {
    teacher = await teacherRepository.findByNip('default', identifier)
      || await teacherRepository.findByNik('default', identifier)
      || await teacherRepository.findByIdUnik('default', identifier)
      || await teacherRepository.findByIdUnik('default', idNormalized)
      || await teacherRepository.findByIdUnik('default', idLower);
  }

  const masterData = student || teacher;
  const type: 'student' | 'teacher' = student ? 'student' : 'teacher';
  let masterId = '';
  if (student) masterId = student.id || (student as any).studentsId || (student as any).idUnik;
  else if (teacher) masterId = teacher.id || (teacher as any).teachersId || (teacher as any).idUnik;
  if (!masterData) throw new Error('NISN/NIP tidak terdaftar.');
  if (masterData.isClaimed) throw new Error('Akun ini sudah diaktifkan dengan email lain. Silakan login menggunakan Email.');

  const birthDate = masterData.tanggalLahir || masterData.birthDate;
  if (!birthDate) throw new Error('Data tanggal lahir tidak ditemukan. Hubungi operator madrasah untuk aktivasi manual.');
  const normalizeDate = (d: string) => d.replace(/[\\/\\-\\s]/g, '');
  const passNorm = normalizeDate(password);
  const birthNorm = normalizeDate(birthDate);
  const isMatch = passNorm === birthNorm || (passNorm.length === 8 && birthNorm.length === 8 && passNorm.substring(0, 2) === birthNorm.substring(6, 8) && passNorm.substring(2, 4) === birthNorm.substring(4, 6) && passNorm.substring(4, 8) === birthNorm.substring(0, 4));
  if (!isMatch) throw new Error('Password salah. Gunakan Tanggal Lahir (DDMMYYYY) Anda sebagai password untuk aktivasi.');

  await auditLog({ action: 'ACTIVATION_ATTEMPT', category: 'AUTH', details: `Aktivasi mandiri ${masterId}` });
  const emailToUse = masterData.email || `${identifier.toLowerCase()}@emam-system.web.id`;
  const res = await registerAndClaimAccount(emailToUse, password, masterId, type, masterData);
  if (!res.success) throw new Error(res.message || 'Gagal mengaktifkan akun otomatis.');
  return { role: res.role };
};

export const loginWithIdentifier = async (identifier: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string; isFirstLogin?: boolean; requiresPasswordChange?: boolean }> => {
  if (isMockMode) {
    const idLower = identifier.trim().toLowerCase();
    let foundLocalUser = await localDb.users.where('email').equalsIgnoreCase(idLower).first()
      || await localDb.users.get(idLower)
      || await localDb.users.where('idUnik').equalsIgnoreCase(idLower).first()
      || await localDb.users.where('uid').equalsIgnoreCase(idLower).first()
      || await localDb.users.where('role').equalsIgnoreCase(idLower).first();

    if (!foundLocalUser) {
      const allUsers = await localDb.users.toArray();
      foundLocalUser = allUsers.find(u => (u.email && u.email.toLowerCase().includes(idLower)) || (u.displayName && u.displayName.toLowerCase().includes(idLower)) || (u.uid && u.uid.toLowerCase().includes(idLower)) || (u.role && u.role.toLowerCase().includes(idLower)));
    }

    let role = identifier.includes('admin') ? UserRole.ADMIN : identifier.includes('dev') ? UserRole.DEVELOPER : UserRole.SISWA;
    let profileData: any = null;
    let userData: any = null;

    if (foundLocalUser) {
      role = normalizeRoleStr(foundLocalUser.role || foundLocalUser.roles?.[0] || 'siswa');
      const legacyUser2 = foundLocalUser as any;
      const tenantId = foundLocalUser.tenantId || '30315537';
      profileData = {
        uid: foundLocalUser.uid || foundLocalUser.id || 'mock-uid', email: legacyUser2.email || foundLocalUser.profile?.email || '',
        displayName: legacyUser2.displayName || foundLocalUser.profile?.displayName || legacyUser2.name || 'Pengguna Simulasi', photoURL: legacyUser2.photoURL || foundLocalUser.profile?.photoURL || null,
        role, roles: foundLocalUser.roles || [role], studentsId: legacyUser2.studentsId || null, teachersId: legacyUser2.teachersId || null, idUnik: legacyUser2.idUnik || null,
        tenantId, referenceId: foundLocalUser.referenceId || null, accountStatus: foundLocalUser.status || legacyUser2.accountStatus || 'Active',
      };
      userData = {
        uid: foundLocalUser.uid || foundLocalUser.id || 'mock-uid', roles: foundLocalUser.roles || [role], accountType: foundLocalUser.accountType || (role === UserRole.SISWA ? 'student' : 'teacher'),
        referenceId: foundLocalUser.referenceId || null, studentId: legacyUser2.studentsId || null, studentsId: legacyUser2.studentsId || null, teacherId: legacyUser2.teachersId || null, teachersId: legacyUser2.teachersId || null,
        tenantId, status: foundLocalUser.status || legacyUser2.accountStatus || 'Active',
      };
    } else {
      const mockUid = `mock-${idLower}`;
      profileData = { uid: mockUid, email: `${idLower}@emam.id`, displayName: idLower.charAt(0).toUpperCase() + idLower.slice(1), photoURL: null, role, roles: [role], studentsId: null, teachersId: null, idUnik: mockUid, tenantId: '30315537', status: 'active', referenceId: null, accountStatus: 'Active' };
      userData = { uid: mockUid, roles: [role], accountType: role === UserRole.SISWA ? 'student' : 'teacher', referenceId: null, studentId: null, studentsId: null, teacherId: null, teachersId: null, tenantId: '30315537', status: 'active' };
    }

    useAuthStore.getState().setUser(profileData); useAuthStore.getState().setAccountStatus(profileData.accountStatus); useUserStore.getState().setUserData(userData); useProfileStore.getState().setProfile(profileData);
    await auditLog({ action: 'LOGIN_MOCK', category: 'AUTH', details: `Successful Mock Login: ${profileData.email} (${role})` });
    return { success: true, role };
  }

  try {
    const idTrimmed = identifier.trim();
    const isEmail = idTrimmed.includes('@');
    const idNormalized = idTrimmed.toUpperCase();
    const idLower = idTrimmed.toLowerCase();

    if (!navigator.onLine) {
      console.log('[AuthService] Device is offline. Initiating offline validation flow.');
      const foundLocalUser = await authRepository.findOfflineUser(identifier);
      if (!foundLocalUser) return { success: false, error: 'Akun belum pernah login di perangkat ini. Hubungkan internet untuk login awal.' };
      const legacyUser = foundLocalUser as any;
      if (foundLocalUser.status === 'suspended' || legacyUser.accountStatus === 'Suspended') return { success: false, error: 'Akun Anda telah dinonaktifkan.' };
      const enteredHash = await hashPassword(password);
      if (!(foundLocalUser as any).passwordHash || (foundLocalUser as any).passwordHash !== enteredHash) return { success: false, error: 'Password salah (Mode Offline).' };
      const role = normalizeRoleStr(foundLocalUser.role || (foundLocalUser as any).peran || 'SISWA');
      const tenantId = foundLocalUser.tenantId || 'default';
      const legacyUser2 = foundLocalUser as any;
      const profileData = {
        uid: foundLocalUser.uid, email: legacyUser2.email || foundLocalUser.profile?.email || '', displayName: legacyUser2.displayName || foundLocalUser.profile?.displayName || legacyUser2.name || 'Pengguna Offline',
        photoURL: legacyUser2.photoURL || foundLocalUser.profile?.photoURL || null, role, roles: foundLocalUser.roles || [role], studentsId: legacyUser2.studentsId || null, teachersId: legacyUser2.teachersId || null,
        idUnik: legacyUser2.idUnik || null, tenantId, referenceId: foundLocalUser.referenceId || null, accountStatus: foundLocalUser.status || legacyUser2.accountStatus || 'Active',
      };
      const userData = {
        uid: foundLocalUser.uid, roles: foundLocalUser.roles || [role], accountType: foundLocalUser.accountType || (role === UserRole.SISWA ? 'student' : 'teacher'), referenceId: foundLocalUser.referenceId || null,
        studentId: legacyUser2.studentsId || null, studentsId: legacyUser2.studentsId || null, teacherId: legacyUser2.teachersId || null, teachersId: legacyUser2.teachersId || null, tenantId, status: foundLocalUser.status || legacyUser2.accountStatus || 'Active',
      };
      useAuthStore.getState().setUser(profileData as any); useAuthStore.getState().setAccountStatus(profileData.accountStatus); useUserStore.getState().setUserData(userData as any); useProfileStore.getState().setProfile(profileData);
      return { success: true, role, requiresPasswordChange: (foundLocalUser as any).mustChangePassword || false };
    }

    if (isEmail) {
      const userCredential = await authGateway.signInWithEmailAndPassword(idTrimmed.toLowerCase(), password);
      const session = await initializeSession(userCredential.user);
      if (!session.success) {
        if (session.status === 'suspended' || session.status === 'inactive') return { success: false, error: 'Akun Anda telah dinonaktifkan.' };
        return { success: false, error: `Gagal inisialisasi sesi pengguna: ${session.status}` };
      }
      const passwordHash = await hashPassword(password);
      await authRepository.cacheOfflineCredentials(session.user, passwordHash);
      await auditLog({ action: 'LOGIN_EMAIL', category: 'SECURITY', details: `Successful Email Login: ${userCredential.user.email} (${session.user?.role})` });
      return { success: true, role: session.user?.role || UserRole.SISWA, requiresPasswordChange: session.user?.mustChangePassword || false };
    }

    let foundUser = await userRepository.findByIdUnik('global', idTrimmed) || await userRepository.findByIdUnik('global', idNormalized) || await userRepository.findByIdUnik('global', idLower);
    if (!foundUser) foundUser = await userRepository.findByNip('global', idTrimmed) || await userRepository.findByNik('global', idTrimmed);
    if (foundUser) {
      const email = foundUser.email;
      if (!email) throw new Error('Email tidak ditemukan untuk akun ini.');
      const userCredential = await authGateway.signInWithEmailAndPassword(email, password);
      const session = await initializeSession(userCredential.user);
      if (!session.success) {
        if (session.status === 'suspended' || session.status === 'inactive') return { success: false, error: 'Akun Anda telah dinonaktifkan.' };
        return { success: false, error: `Gagal inisialisasi sesi pengguna: ${session.status}` };
      }
      const passwordHash = await hashPassword(password);
      await authRepository.cacheOfflineCredentials(session.user, passwordHash);
      await auditLog({ action: 'LOGIN_IDENTIFIER', category: 'SECURITY', details: `Successful Identifier Login: ${email} (${session.user?.role})` });
      return { success: true, role: session.user?.role || UserRole.SISWA, requiresPasswordChange: session.user?.mustChangePassword || false };
    }

    const activationRes = await handleAccountActivation(idTrimmed, idNormalized, idLower, password);
    return { success: true, role: activationRes.role, isFirstLogin: true };
  } catch (e: any) {
    let message = e.message;
    if (e.code === 'auth/wrong-password') message = 'Password salah.';
    if (e.code === 'auth/user-not-found') message = 'Akun tidak ditemukan.';
    if (e.code === 'auth/invalid-credential') message = 'Kredensial tidak valid.';
    if (e.code === 'auth/invalid-email') message = 'Format email tidak valid.';
    if (e.code === 'auth/too-many-requests') message = 'Terlalu banyak percobaan login. Silakan tunggu sebentar.';
    return { success: false, error: message };
  }
};

export const activateAccountByAdmin = async (payload: {
  email: string; password?: string; displayName: string; role: string; linkId?: string; idUnik?: string; type: 'student' | 'teacher' | 'other'; photoBase64?: string; tenantId?: string;
}): Promise<{ success: boolean; message?: string; uid?: string; error?: string }> => {
  if (isMockMode) return { success: true, message: 'Simulasi: Akun berhasil diaktifkan.', uid: 'mock-uid-' + Date.now() };
  try {
    const idToken = await getCurrentIdToken();
    if (!idToken) throw new Error('Sesi expired. Silakan login ulang.');
    const response = await axios.post('/api/developer/admin/activate-user', payload, { headers: { Authorization: `Bearer ${idToken}` } });
    return response.data;
  } catch (e: any) {
    const message = e.response?.data?.message || e.message;
    console.error('[AUTH_SERVICE] Admin Activation Fail:', message);
    return { success: false, error: message };
  }
};

export const createTeacherAccount = async (email: string, password: string, role: UserRole): Promise<string> => {
  if (isMockMode) return 'mock-uid-' + Date.now();
  try {
    const userCredential = await authGateway.createUserWithEmailAndPassword(email, password);
    return userCredential.user.uid;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      const found = await userRepository.findByEmail(email);
      if (found) return found.id;
    }
    throw error;
  }
};

export const deleteAccountByAdmin = async (uid: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  if (isMockMode) return { success: true, message: 'Simulasi: Akun berhasil dihapus.' };
  try {
    const idToken = await getCurrentIdToken();
    if (!idToken) throw new Error('Sesi expired. Silakan login ulang.');
    const response = await axios.delete(`/api/developer/admin/delete-user/${uid}`, { headers: { Authorization: `Bearer ${idToken}` } });
    return response.data;
  } catch (e: any) {
    const message = e.response?.data?.message || e.message;
    console.error('[AUTH_SERVICE] Admin Delete Fail:', message);
    return { success: false, error: message };
  }
};

export const registerIndependentAccount = async (payload: {
  email: string; password: string; displayName: string; role: UserRole; idUnik: string; nisn?: string; phone: string; tenantId?: string; tingkatRombel?: string; classId?: string;
}): Promise<{ success: boolean; message?: string }> => {
  try {
    if (isMockMode) return { success: true };
    const userCredential = await authGateway.createUserWithEmailAndPassword(payload.email, payload.password);
    const user = userCredential.user;
    await authGateway.updateProfile(user, { displayName: payload.displayName });
    let validatedRole = payload.role;
    if (validatedRole !== UserRole.SISWA && validatedRole !== UserRole.GURU) {
      console.warn(`[AUTH_SECURITY_GUARD] Menggagalkan percobaan registrasi mandiri dengan peran eksekutif: ${validatedRole}. Dialihkan ke Guru.`);
      validatedRole = UserRole.GURU;
    }
    let matchedMasterId: string | null = null;
    const targetTenantId = payload.tenantId || '30315537';
    if (validatedRole === UserRole.SISWA) {
      let student = payload.idUnik ? await studentRepository.fetchByIdUnik(targetTenantId, payload.idUnik) : null;
      if (!student && payload.idUnik) student = await studentRepository.findById(payload.idUnik, targetTenantId);
      if (student && student.tenantId === targetTenantId) matchedMasterId = student.id;
    } else {
      let teacher = payload.idUnik ? await teacherRepository.fetchByIdUnik(targetTenantId, payload.idUnik) : null;
      if (!teacher && payload.idUnik) teacher = await teacherRepository.findById(payload.idUnik, targetTenantId);
      if (teacher && teacher.tenantId === targetTenantId) matchedMasterId = teacher.id;
    }
    const userDoc: any = {
      uid: user.uid, displayName: payload.displayName, email: user.email, role: validatedRole, roles: [validatedRole], tenantId: targetTenantId, referenceId: matchedMasterId,
      studentsId: validatedRole === UserRole.SISWA ? matchedMasterId : null, teachersId: validatedRole !== UserRole.SISWA ? matchedMasterId : null, idUnik: payload.idUnik,
      isClaimed: !!matchedMasterId, accountStatus: matchedMasterId ? 'pending' : 'needs_profile_completion', approvalStatus: 'pending', createdAt: new Date().toISOString(), isSso: false, isIndependent: true,
    };
    if (validatedRole === UserRole.SISWA) {
      userDoc.idUnik = payload.idUnik || ''; userDoc.studentsId = payload.idUnik || ''; userDoc.teachersId = '';
    } else if ([UserRole.GURU, UserRole.WALI_KELAS, UserRole.KEPALA_MADRASAH, UserRole.KEPALA_TU, UserRole.GURU_BK, UserRole.STAF, UserRole.WAKAMAD, UserRole.PIKET, UserRole.KURIKULUM, UserRole.KESISWAAN, UserRole.HUMAS, UserRole.GTK].includes(validatedRole)) {
      userDoc.idUnik = payload.idUnik || ''; userDoc.teachersId = payload.idUnik || ''; userDoc.studentsId = '';
      if (payload.idUnik.length >= 18) userDoc.nip = payload.idUnik;
      else if (payload.idUnik.length === 16) userDoc.nik = payload.idUnik;
    } else {
      userDoc.idUnik = payload.idUnik || ''; userDoc.studentsId = ''; userDoc.teachersId = '';
    }
    if (payload.nisn) userDoc.nisn = payload.nisn;
    if (payload.phone) userDoc.phone = payload.phone;
    if (payload.tingkatRombel) { userDoc.tingkatRombel = payload.tingkatRombel; userDoc.class = payload.tingkatRombel; }
    if (payload.classId) userDoc.classId = payload.classId;
    const cleanUserDoc: any = { id: user.uid };
    Object.keys(userDoc).forEach((key) => { if (userDoc[key] !== undefined && userDoc[key] !== null) cleanUserDoc[key] = userDoc[key]; });
    await userRepository.update(cleanUserDoc);
    await auditLog({ action: 'REGISTER_INDEPENDENT', category: 'AUTH', details: `Pendaftaran mandiri oleh ${payload.displayName} (${payload.role})` });
    return { success: true };
  } catch (e: any) {
    let message = e.message;
    if (e.code === 'auth/email-already-in-use') message = 'Email sudah digunakan.';
    return { success: false, message };
  }
};

export const getEmailByIdentifier = async (identifier: string): Promise<string | null> => {
  if (isMockMode) return identifier.includes('admin') ? 'admin@emam-system.web.id' : 'student@emam-system.web.id';
  try {
    const user = await userRepository.findByIdUnik('global', identifier.trim());
    return user?.email || null;
  } catch (e: any) {
    console.error('Error finding user by identifier:', e?.message || 'Error');
    return null;
  }
};

export const updateUserCoverPhoto = async (uid: string, coverURL: string): Promise<{ success: boolean; message?: string }> => {
  if (isMockMode) return { success: true, message: 'Foto sampul berhasil diperbarui (Simulasi).' };
  try {
    getSystemContext('default', uid);
    const user = await userRepository.getByUid(uid);
    if (user) await userRepository.update({ ...user, coverURL } as any);
    return { success: true };
  } catch (error: any) {
    console.error('Gagal update foto sampul di sistem:', error);
    throw new Error(sanitizeError(error));
  }
};

export const processForcedPasswordChange = async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('Anda belum login.');
    await authGateway.updatePassword(currentUser, newPassword);
    const uid = currentUser.uid;
    const sysContext = getSystemContext('default', uid);
    const user = await userRepository.getByUid(uid);
    if (user) { const userToSave: any = { ...user }; delete userToSave.mustChangePassword; await userRepository.update(userToSave); }
    try {
      const teacher = await teacherRepository.findById(uid, sysContext.tenantId);
      if (teacher) { const teacherToSave: any = { ...teacher }; delete teacherToSave.mustChangePassword; await teacherRepository.update(teacherToSave); }
      else {
        const t2 = await teacherRepository.findById(uid, sysContext.tenantId);
        if (t2) { const teacherToSave2: any = { ...t2 }; delete teacherToSave2.mustChangePassword; await teacherRepository.update(teacherToSave2); }
      }
    } catch (e) {}
    return { success: true };
  } catch (e: any) {
    let message = e.message;
    if (e.code === 'auth/weak-password') message = 'Password terlalu lemah (minimal 6 karakter).';
    if (e.code === 'auth/requires-recent-login') message = 'Silakan login ulang lalu coba lagi.';
    return { success: false, message };
  }
};

export const updateUserProfilePhoto = async (uid: string, photoURL: string): Promise<{ success: boolean; message?: string }> => {
  if (isMockMode) return { success: true, message: 'Foto profil berhasil diperbarui (Simulasi).' };
  try {
    const sysContext = getSystemContext('default', uid);
    const user = await userRepository.getByUid(uid);
    if (user) {
      await userRepository.update({ ...user, photoURL } as any);
      const legacyUser = user as any;
      const studentId = legacyUser.studentsId || legacyUser.studentId;
      const teacherId = legacyUser.teachersId || legacyUser.teacherId;
      if (studentId) {
        const student = await studentRepository.findById(studentId, sysContext.tenantId);
        if (student) await studentRepository.update({ ...student, photoURL } as any);
      }
      if (teacherId) {
        const teacher = await teacherRepository.findById(teacherId, sysContext.tenantId);
        if (teacher) await teacherRepository.update({ ...teacher, photoURL } as any);
      }
    }
    await incrementMasterVersion();
    return { success: true };
  } catch (error: any) {
    console.error('Gagal update foto profil di sistem:', error);
    throw new Error(sanitizeError(error));
  }
};

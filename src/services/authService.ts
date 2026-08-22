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
  }
};
export const logoutUser = logout;

export const initializeSession = async (firebaseUser: any): Promise<{ success: boolean; status: string; user?: any }> => {
  if (!firebaseUser) {
    SecurityContextService.clear();
    return { success: false, status: 'unauthenticated' };
  }
  try {
    SecurityContextService.setLifecycleState('AUTHENTICATED');
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
      return { success: false, status: canonicalUser.status };
    }

    SecurityContextService.initialize(canonicalUser as any);
    SecurityContextService.setLifecycleState('READY');

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

const handleAccountActivation = async (identifier: string, idNormalized: string, idLower: string, password: string) => {
  const student = await studentRepository.fetchByIdUnik('', identifier) || await studentRepository.fetchByIdUnik('', idNormalized) || await studentRepository.fetchByIdUnik('', idLower);
  let teacher: any = null;
  if (!student) teacher = await teacherRepository.findByNip('', identifier) || await teacherRepository.findByNik('', identifier) || await teacherRepository.findByIdUnik('', identifier) || await teacherRepository.findByIdUnik('', idNormalized) || await teacherRepository.findByIdUnik('', idLower);
  const masterData = student || teacher;
  const type: 'student' | 'teacher' = student ? 'student' : 'teacher';
  const masterId = student ? (student.id || (student as any).studentsId || (student as any).idUnik) : teacher ? (teacher.id || (teacher as any).teachersId || (teacher as any).idUnik) : '';
  if (!masterData) throw new Error('NISN/NIP tidak terdaftar.');
  if (masterData.isClaimed) throw new Error('Akun ini sudah diaktifkan dengan email lain. Silakan login menggunakan Email.');
  const birthDate = masterData.tanggalLahir || masterData.birthDate;
  if (!birthDate) throw new Error('Data tanggal lahir tidak ditemukan. Hubungi operator madrasah untuk aktivasi manual.');
  const normalizeDate = (d: string) => d.replace(/[\\/\\-\\s]/g, '');
  const passNorm = normalizeDate(password); const birthNorm = normalizeDate(birthDate);
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
    const foundLocalUser = await localDb.users.where('email').equalsIgnoreCase(idLower).first() || await localDb.users.get(idLower) || await localDb.users.where('idUnik').equalsIgnoreCase(idLower).first() || await localDb.users.where('uid').equalsIgnoreCase(idLower).first();
    if (!foundLocalUser) return { success: false, error: 'Akun simulasi tidak ditemukan.' };
    const tenantId = String(foundLocalUser.tenantId || '').trim();
    const referenceId = String(foundLocalUser.referenceId || '').trim();
    if (!tenantId || ['global', 'default', 'unknown', 'system'].includes(tenantId.toLowerCase()) || !referenceId) return { success: false, error: 'Akun simulasi tidak memiliki tenant/reference canonical.' };
    const role = normalizeRoleStr(foundLocalUser.role || foundLocalUser.roles?.[0] || 'siswa');
    const profileData: any = { uid: foundLocalUser.uid || foundLocalUser.id, email: (foundLocalUser as any).email || '', displayName: (foundLocalUser as any).displayName || 'Pengguna Simulasi', photoURL: (foundLocalUser as any).photoURL || null, role, roles: foundLocalUser.roles || [role], studentsId: (foundLocalUser as any).studentsId || null, teachersId: (foundLocalUser as any).teachersId || null, idUnik: (foundLocalUser as any).idUnik || null, tenantId, referenceId, accountStatus: foundLocalUser.status || 'Active' };
    useAuthStore.getState().setUser(profileData); useAuthStore.getState().setAccountStatus(profileData.accountStatus); useUserStore.getState().setUserData({ uid: profileData.uid, roles: profileData.roles, accountType: foundLocalUser.accountType || 'madrasah', referenceId, tenantId, status: foundLocalUser.status || 'Active' } as any); useProfileStore.getState().setProfile(profileData);
    await auditLog({ action: 'LOGIN_MOCK', category: 'AUTH', details: `Successful Mock Login: ${profileData.email} (${role})` });
    return { success: true, role };
  }

  try {
    const idTrimmed = identifier.trim(); const isEmail = idTrimmed.includes('@'); const idNormalized = idTrimmed.toUpperCase(); const idLower = idTrimmed.toLowerCase();
    if (!navigator.onLine) {
      const foundLocalUser = await authRepository.findOfflineUser(identifier);
      if (!foundLocalUser) return { success: false, error: 'Akun belum pernah login di perangkat ini. Hubungkan internet untuk login awal.' };
      const legacyUser = foundLocalUser as any;
      if (foundLocalUser.status === 'suspended' || legacyUser.accountStatus === 'Suspended') return { success: false, error: 'Akun Anda telah dinonaktifkan.' };
      const enteredHash = await hashPassword(password);
      if (!legacyUser.passwordHash || legacyUser.passwordHash !== enteredHash) return { success: false, error: 'Password salah (Mode Offline).' };
      const role = normalizeRoleStr(foundLocalUser.role || legacyUser.peran || 'SISWA');
      const tenantId = String(foundLocalUser.tenantId || '').trim(); const referenceId = String(foundLocalUser.referenceId || '').trim();
      if (!tenantId || ['global', 'default', 'unknown', 'system'].includes(tenantId.toLowerCase()) || !referenceId) return { success: false, error: 'Identitas offline tidak memiliki tenant/reference canonical.' };
      const profileData: any = { uid: foundLocalUser.uid, email: legacyUser.email || foundLocalUser.profile?.email || '', displayName: legacyUser.displayName || foundLocalUser.profile?.displayName || legacyUser.name || 'Pengguna Offline', photoURL: legacyUser.photoURL || foundLocalUser.profile?.photoURL || null, role, roles: foundLocalUser.roles || [role], studentsId: legacyUser.studentsId || null, teachersId: legacyUser.teachersId || null, idUnik: legacyUser.idUnik || null, tenantId, referenceId, accountStatus: foundLocalUser.status || legacyUser.accountStatus || 'Active' };
      useAuthStore.getState().setUser(profileData); useAuthStore.getState().setAccountStatus(profileData.accountStatus); useUserStore.getState().setUserData({ uid: foundLocalUser.uid, roles: foundLocalUser.roles || [role], accountType: foundLocalUser.accountType || 'madrasah', referenceId, tenantId, status: foundLocalUser.status || 'Active' } as any); useProfileStore.getState().setProfile(profileData);
      return { success: true, role, requiresPasswordChange: legacyUser.mustChangePassword || false };
    }

    if (isEmail) {
      const userCredential = await authGateway.signInWithEmailAndPassword(idTrimmed.toLowerCase(), password);
      const session = await initializeSession(userCredential.user);
      if (!session.success) return { success: false, error: session.status === 'suspended' || session.status === 'inactive' ? 'Akun Anda telah dinonaktifkan.' : `Gagal inisialisasi sesi pengguna: ${session.status}` };
      await authRepository.cacheOfflineCredentials(session.user, await hashPassword(password));
      await auditLog({ action: 'LOGIN_EMAIL', category: 'SECURITY', details: `Successful Email Login: ${userCredential.user.email} (${session.user?.role})` });
      return { success: true, role: session.user?.role || UserRole.SISWA, requiresPasswordChange: session.user?.mustChangePassword || false };
    }

    let foundUser = await userRepository.findByIdUnik('', idTrimmed) || await userRepository.findByIdUnik('', idNormalized) || await userRepository.findByIdUnik('', idLower);
    if (!foundUser) foundUser = await userRepository.findByNip('', idTrimmed) || await userRepository.findByNik('', idTrimmed);
    if (foundUser) {
      const email = foundUser.email; if (!email) throw new Error('Email tidak ditemukan untuk akun ini.');
      const userCredential = await authGateway.signInWithEmailAndPassword(email, password);
      const session = await initializeSession(userCredential.user);
      if (!session.success) return { success: false, error: session.status === 'suspended' || session.status === 'inactive' ? 'Akun Anda telah dinonaktifkan.' : `Gagal inisialisasi sesi pengguna: ${session.status}` };
      await authRepository.cacheOfflineCredentials(session.user, await hashPassword(password));
      await auditLog({ action: 'LOGIN_IDENTIFIER', category: 'SECURITY', details: `Successful Identifier Login: ${email} (${session.user?.role})` });
      return { success: true, role: session.user?.role || UserRole.SISWA, requiresPasswordChange: session.user?.mustChangePassword || false };
    }

    const activationRes = await handleAccountActivation(idTrimmed, idNormalized, idLower, password);
    return { success: true, role: activationRes.role, isFirstLogin: true };
  } catch (e: any) {
    let message = e.message; if (e.code === 'auth/wrong-password') message = 'Password salah.'; if (e.code === 'auth/user-not-found') message = 'Akun tidak ditemukan.'; if (e.code === 'auth/invalid-credential') message = 'Kredensial tidak valid.'; if (e.code === 'auth/invalid-email') message = 'Format email tidak valid.'; if (e.code === 'auth/too-many-requests') message = 'Terlalu banyak percobaan login. Silakan tunggu sebentar.';
    return { success: false, error: message };
  }
};

export const activateAccountByAdmin = async (payload: { email: string; password?: string; displayName: string; role: string; linkId?: string; idUnik?: string; type: 'student' | 'teacher' | 'other'; photoBase64?: string; tenantId?: string }): Promise<{ success: boolean; message?: string; uid?: string; error?: string }> => {
  if (isMockMode) return { success: true, message: 'Simulasi: Akun berhasil diaktifkan.', uid: 'mock-uid-' + Date.now() };
  try { const idToken = await getCurrentIdToken(); if (!idToken) throw new Error('Sesi expired. Silakan login ulang.'); const response = await axios.post('/api/developer/admin/activate-user', payload, { headers: { Authorization: `Bearer ${idToken}` } }); return response.data; }
  catch (e: any) { const message = e.response?.data?.message || e.message; console.error('[AUTH_SERVICE] Admin Activation Fail:', message); return { success: false, error: message }; }
};

export const createTeacherAccount = async (email: string, password: string, role: UserRole): Promise<string> => {
  if (isMockMode) return 'mock-uid-' + Date.now();
  try { const userCredential = await authGateway.createUserWithEmailAndPassword(email, password); return userCredential.user.uid; }
  catch (error: any) { if (error.code === 'auth/email-already-in-use') { const found = await userRepository.findByEmail(email); if (found) return found.id; } throw error; }
};

export const deleteAccountByAdmin = async (uid: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  if (isMockMode) return { success: true, message: 'Simulasi: Akun berhasil dihapus.' };
  try { const idToken = await getCurrentIdToken(); if (!idToken) throw new Error('Sesi expired. Silakan login ulang.'); const response = await axios.delete(`/api/developer/admin/delete-user/${uid}`, { headers: { Authorization: `Bearer ${idToken}` } }); return response.data; }
  catch (e: any) { const message = e.response?.data?.message || e.message; console.error('[AUTH_SERVICE] Admin Delete Fail:', message); return { success: false, error: message }; }
};

export const registerIndependentAccount = async (payload: { email: string; password: string; displayName: string; role: UserRole; idUnik: string; nisn?: string; phone: string; tenantId?: string; tingkatRombel?: string; classId?: string }): Promise<{ success: boolean; message?: string }> => {
  try {
    if (isMockMode) return { success: true };
    const userCredential = await authGateway.createUserWithEmailAndPassword(payload.email, payload.password); const user = userCredential.user; await authGateway.updateProfile(user, { displayName: payload.displayName });
    let validatedRole = payload.role;
    if (validatedRole !== UserRole.SISWA && validatedRole !== UserRole.GURU) { console.warn(`[AUTH_SECURITY_GUARD] Menggagalkan percobaan registrasi mandiri dengan peran eksekutif: ${validatedRole}.`); validatedRole = UserRole.GURU; }
    const targetTenantId = String(payload.tenantId || '').trim(); if (!targetTenantId || ['global', 'default', 'unknown', 'system'].includes(targetTenantId.toLowerCase())) return { success: false, message: 'Tenant canonical wajib diisi.' };
    let matchedMasterId: string | null = null;
    if (validatedRole === UserRole.SISWA) { const student = payload.idUnik ? await studentRepository.fetchByIdUnik(targetTenantId, payload.idUnik) : null; const matched = student || (payload.idUnik ? await studentRepository.findById(payload.idUnik, targetTenantId) : null); if (matched?.tenantId === targetTenantId) matchedMasterId = matched.id; }
    else { const teacher = payload.idUnik ? await teacherRepository.fetchByIdUnik(targetTenantId, payload.idUnik) : null; const matched = teacher || (payload.idUnik ? await teacherRepository.findById(payload.idUnik, targetTenantId) : null); if (matched?.tenantId === targetTenantId) matchedMasterId = matched.id; }
    const userDoc: any = { uid: user.uid, displayName: payload.displayName, email: user.email, role: validatedRole, roles: [validatedRole], tenantId: targetTenantId, referenceId: matchedMasterId, studentsId: validatedRole === UserRole.SISWA ? matchedMasterId : null, teachersId: validatedRole !== UserRole.SISWA ? matchedMasterId : null, idUnik: payload.idUnik, isClaimed: !!matchedMasterId, accountStatus: matchedMasterId ? 'pending' : 'needs_profile_completion', approvalStatus: 'pending', createdAt: new Date().toISOString(), isSso: false, isIndependent: true };
    if (payload.nisn) userDoc.nisn = payload.nisn; if (payload.phone) userDoc.phone = payload.phone; if (payload.tingkatRombel) { userDoc.tingkatRombel = payload.tingkatRombel; userDoc.class = payload.tingkatRombel; } if (payload.classId) userDoc.classId = payload.classId;
    if (validatedRole === UserRole.SISWA) { userDoc.studentsId = payload.idUnik || ''; userDoc.teachersId = ''; }
    else { userDoc.teachersId = payload.idUnik || ''; userDoc.studentsId = ''; if (payload.idUnik.length >= 18) userDoc.nip = payload.idUnik; else if (payload.idUnik.length === 16) userDoc.nik = payload.idUnik; }
    const cleanUserDoc: any = { id: user.uid }; Object.keys(userDoc).forEach((key) => { if (userDoc[key] !== undefined && userDoc[key] !== null) cleanUserDoc[key] = userDoc[key]; }); await userRepository.update(cleanUserDoc);
    await auditLog({ action: 'REGISTER_INDEPENDENT', category: 'AUTH', details: `Pendaftaran mandiri oleh ${payload.displayName} (${payload.role})` }); return { success: true };
  } catch (e: any) { return { success: false, message: e.code === 'auth/email-already-in-use' ? 'Email sudah digunakan.' : e.message }; }
};

export const getEmailByIdentifier = async (identifier: string): Promise<string | null> => {
  if (isMockMode) return null;
  try { const user = await userRepository.findByIdUnik('', identifier.trim()); return user?.email || null; }
  catch (e: any) { console.error('Error finding user by identifier:', e?.message || 'Error'); return null; }
};

export const updateUserCoverPhoto = async (uid: string, coverURL: string): Promise<{ success: boolean; message?: string }> => {
  if (isMockMode) return { success: true, message: 'Foto sampul berhasil diperbarui (Simulasi).' };
  try { const context = SecurityContextService.getContext(); if (context.uid !== uid) throw new Error('Security context UID mismatch.'); const user = await userRepository.getByUid(uid); if (user) await userRepository.update({ ...user, coverURL } as any); return { success: true }; }
  catch (error: any) { console.error('Gagal update foto sampul di sistem:', error); throw new Error(sanitizeError(error)); }
};

export const processForcedPasswordChange = async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
  try { const currentUser = getCurrentUser(); if (!currentUser) throw new Error('Anda belum login.'); const context = SecurityContextService.getContext(); if (context.uid !== currentUser.uid) throw new Error('Security context UID mismatch.'); await authGateway.updatePassword(currentUser, newPassword); const user = await userRepository.getByUid(currentUser.uid); if (user) { const userToSave: any = { ...user }; delete userToSave.mustChangePassword; await userRepository.update(userToSave); } return { success: true }; }
  catch (e: any) { let message = e.message; if (e.code === 'auth/weak-password') message = 'Password terlalu lemah (minimal 6 karakter).'; if (e.code === 'auth/requires-recent-login') message = 'Silakan login ulang lalu coba lagi.'; return { success: false, message }; }
};

export const updateUserProfilePhoto = async (uid: string, photoURL: string): Promise<{ success: boolean; message?: string }> => {
  if (isMockMode) return { success: true, message: 'Foto profil berhasil diperbarui (Simulasi).' };
  try {
    const context = SecurityContextService.getContext(); if (context.uid !== uid) throw new Error('Security context UID mismatch.'); const user = await userRepository.getByUid(uid);
    if (user) { await userRepository.update({ ...user, photoURL } as any); const legacyUser = user as any; const studentId = legacyUser.studentsId || legacyUser.studentId; const teacherId = legacyUser.teachersId || legacyUser.teacherId; if (studentId) { const student = await studentRepository.findById(studentId, context.tenantId); if (student) await studentRepository.update({ ...student, photoURL } as any); } if (teacherId) { const teacher = await teacherRepository.findById(teacherId, context.tenantId); if (teacher) await teacherRepository.update({ ...teacher, photoURL } as any); } }
    await incrementMasterVersion(); return { success: true };
  } catch (error: any) { console.error('Gagal update foto profil di sistem:', error); throw new Error(sanitizeError(error)); }
};

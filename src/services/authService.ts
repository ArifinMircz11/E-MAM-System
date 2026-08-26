import { UserRole } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { db } from '@/database/db';

export const isMockMode = (): boolean => {
  return typeof window !== 'undefined' && localStorage.getItem('e_mam_mock_mode') === 'true';
};

export const safeStringify = (data: any): string => {
  try {
    return JSON.stringify(data);
  } catch {
    return '{}';
  }
};

export const forceTokenRefresh = async (): Promise<boolean> => {
  return true;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  LIST = 'list',
}


export const handleFirestoreError = (error: unknown, operation: OperationType, path: string) => {
  console.error(`Firestore Error during ${operation} at ${path}:`, error);
  throw error;
};


export const activateAccountByAdmin = async (payload: {
  email: string;
  password?: string;
  displayName: string;
  role: UserRole;
  linkId: string;
  idUnik?: string;
  type: 'student' | 'teacher' | 'other';
}): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const newUser = {
      id: `user_${Date.now()}`,
      uid: `uid_${Date.now()}`,
      email: payload.email,
      displayName: payload.displayName,
      role: payload.role,
      roles: [payload.role],
      permissions: ['*'],
      referenceId: payload.linkId,
      idUnik: payload.idUnik || '',
      isClaimed: true,
      isSso: false,
      approvalStatus: 'approved',
      status: 'active',
      syncStatus: 'synced',
      version: 1,
      schemaVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
      tenantId: 'tenant-demo',
    };

    if (db.table('users')) {
      await db.table('users').put(newUser);
    }

    if (payload.type === 'student' && payload.linkId) {
      if (db.table('students')) {
        const student = await db.table('students').get(payload.linkId);
        if (student) {
          await db.table('students').update(payload.linkId, {
            isClaimed: true,
            authUid: newUser.uid,
            updatedAt: Date.now(),
          });
        }
      }
    } else if (payload.type === 'teacher' && payload.linkId) {
      if (db.table('teachers')) {
        const teacher = await db.table('teachers').get(payload.linkId);
        if (teacher) {
          await db.table('teachers').update(payload.linkId, {
            linkedUserId: newUser.uid,
            updatedAt: Date.now(),
          });
        }
      }
    }

    return {
      success: true,
      message: `Akses untuk ${payload.displayName} berhasil diaktifkan!`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gagal aktivasi akun.',
    };
  }
};


export const normalizeRoleStr = (role?: string | null): UserRole => {
  if (!role) return UserRole.GUEST;
  const lower = role.toLowerCase().trim();
  switch (lower) {
    case 'developer':
      return UserRole.DEVELOPER;
    case 'super_admin':
      return UserRole.SUPER_ADMIN;
    case 'admin':
      return UserRole.ADMIN;
    case 'admin_madrasah':
      return UserRole.ADMIN_MADRASAH;
    case 'admin_operasional':
      return UserRole.ADMIN_OPERASIONAL;
    case 'kepala_madrasah':
    case 'kamad':
      return UserRole.KEPALA_MADRASAH;
    case 'kepala_tu':
      return UserRole.KEPALA_TU;
    case 'guru':
      return UserRole.GURU;
    case 'wali_kelas':
      return UserRole.WALI_KELAS;
    case 'guru_bk':
    case 'bk':
      return UserRole.GURU_BK;
    case 'staf_tu':
    case 'staf':
      return UserRole.STAF_TU;
    case 'siswa':
      return UserRole.SISWA;
    case 'orangtua':
    case 'orang_tua':
      return UserRole.ORANG_TUA;
    case 'kanwil':
      return UserRole.KANWIL;
    case 'kemenag':
      return UserRole.KEMENAG;
    default:
      return UserRole.GUEST;
  }
};

export const getCurrentUser = (): CanonicalUser | null => {
  return useAuthStore.getState().user as CanonicalUser | null;
};

export const getCurrentIdToken = async (): Promise<string | null> => {
  return 'mock-token-' + Date.now();
};

export const onAuthStateChanged = (callback: (user: any) => void) => {
  let lastUid: string | undefined = undefined;
  const unsubscribe = useAuthStore.subscribe((state) => {
    const currentUid = state.user?.uid || state.user?.id;
    if (currentUid !== lastUid) {
      lastUid = currentUid;
      callback(state.user);
    }
  });
  const initialUser = useAuthStore.getState().user;
  lastUid = initialUser?.uid || initialUser?.id;
  callback(initialUser);
  return unsubscribe;
};

export const loginWithIdentifier = async (identifier: string, password?: string) => {
  const mockUser: CanonicalUser = {
    id: 'user-' + identifier.replace(/[^a-zA-Z0-9]/g, '_'),
    uid: 'uid-' + identifier.replace(/[^a-zA-Z0-9]/g, '_'),
    tenantId: 'tenant-demo',
    accountType: 'madrasah',
    role: identifier.toLowerCase().includes('dev')
      ? UserRole.DEVELOPER
      : identifier.toLowerCase().includes('admin')
      ? UserRole.ADMIN
      : identifier.toLowerCase().includes('guru')
      ? UserRole.GURU
      : identifier.toLowerCase().includes('siswa')
      ? UserRole.SISWA
      : UserRole.ADMIN,
    roles: [UserRole.ADMIN],
    permissions: ['*'],
    referenceId: 'REF001',
    isClaimed: true,
    isSso: false,
    approvalStatus: 'approved',
    email: identifier.includes('@') ? identifier : `${identifier}@emam.sch.id`,
    displayName: identifier.toUpperCase(),
    status: 'active',
    syncStatus: 'synced',
    version: 1,
    schemaVersion: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deleted: false,
  };

  useAuthStore.getState().setUser(mockUser);
  useUserStore.getState().setTenantId(mockUser.tenantId);
  useUserStore.getState().setRoles(mockUser.roles);

  return { success: true, user: mockUser };
};

export const loginWithGoogle = async () => {
  return loginWithIdentifier('google-user@emam.sch.id');
};

export const logout = async (): Promise<void> => {
  useAuthStore.getState().logout();
};

export const logoutUser = logout;

export const sendPasswordResetEmail = async (email: string) => {
  return { success: true };
};

export const processForcedPasswordChange = async (newPassword: string) => {
  return { success: true };
};

export const registerAndClaimAccount = async (
  email: string,
  password?: string,
  linkId?: string,
  roleSwitch?: 'student' | 'teacher',
  masterData?: any,
): Promise<{ success: boolean; role: UserRole; message?: string }> => {
  try {
    const role = roleSwitch === 'student' ? UserRole.SISWA : UserRole.GURU;
    const newUser = {
      id: `user_${Date.now()}`,
      uid: `uid_${Date.now()}`,
      email,
      displayName: masterData?.namaLengkap || masterData?.name || email,
      role,
      roles: [role],
      permissions: ['*'],
      referenceId: linkId || '',
      idUnik: masterData?.idUnik || '',
      isClaimed: true,
      isSso: false,
      approvalStatus: 'approved',
      status: 'active',
      syncStatus: 'synced',
      version: 1,
      schemaVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
      tenantId: 'tenant-demo',
    };

    if (db.table('users')) {
      await db.table('users').put(newUser);
    }

    if (roleSwitch === 'student' && linkId) {
      if (db.table('students')) {
        await db.table('students').update(linkId, {
          isClaimed: true,
          authUid: newUser.uid,
          updatedAt: Date.now(),
        });
      }
    } else if (roleSwitch === 'teacher' && linkId) {
      if (db.table('teachers')) {
        await db.table('teachers').update(linkId, {
          linkedUserId: newUser.uid,
          updatedAt: Date.now(),
        });
      }
    }

    useAuthStore.getState().setUser(newUser);
    useUserStore.getState().setTenantId(newUser.tenantId);
    useUserStore.getState().setRoles(newUser.roles);

    return {
      success: true,
      role,
    };
  } catch (err: any) {
    return {
      success: false,
      role: UserRole.GUEST,
      message: err.message,
    };
  }
};

export const registerIndependentAccount = async (data: any): Promise<{ success: boolean; message?: string }> => {
  try {
    const newUser = {
      id: `user_${Date.now()}`,
      uid: `uid_${Date.now()}`,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      roles: [data.role],
      permissions: ['*'],
      referenceId: '',
      idUnik: data.idUnik || '',
      isClaimed: false,
      isSso: false,
      approvalStatus: 'pending',
      status: 'pending',
      syncStatus: 'synced',
      version: 1,
      schemaVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
      tenantId: 'tenant-demo',
      phone: data.phone,
    };

    if (db.table('users')) {
      await db.table('users').put(newUser);
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
    };
  }
};

export const submitProfileCompletionRequest = async (data: any) => {
  return { success: true, data };
};

export const updateUserProfilePhoto = async (photoURL: string) => {
  const user = useAuthStore.getState().user;
  if (user) {
    useAuthStore.getState().setUser({ ...user, photoURL });
  }
  return { success: true };
};

export const updateUserCoverPhoto = async (coverPhotoURL: string) => {
  const user = useAuthStore.getState().user;
  if (user) {
    useAuthStore.getState().setUser({ ...user, coverPhotoURL } as any);
  }
  return { success: true };
};


export const isReadOnly = (): boolean => {
  const user = useAuthStore.getState().user;
  return !user || user.role === UserRole.GUEST || user.role === UserRole.TAMU;
};

export const isStudent = (): boolean => {
  const user = useAuthStore.getState().user;
  return user?.role === UserRole.SISWA;
};

export const getUserData = async (uid: string) => {
  return useAuthStore.getState().user;
};

export const getUserProfile = async (uid: string) => {
  return useAuthStore.getState().user;
};

export const getFriendlyErrorMessage = (error: any): string => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';
  const message = error.message || String(error);
  if (message.includes('permission-denied') || message.includes('peran')) {
    return 'Akses ditolak: Anda tidak memiliki wewenang untuk melakukan tindakan ini.';
  }
  if (message.includes('network') || message.includes('offline')) {
    return 'Koneksi bermasalah: Menggunakan mode luring (offline) lokal.';
  }
  if (message.includes('not-found') || message.includes('tidak ditemukan')) {
    return 'Data tidak ditemukan di database.';
  }
  return message;
};

export const approvePendingAccount = async (id: string): Promise<boolean> => {
  try {
    if (db.table('users')) {
      await db.table('users').update(id, {
        approvalStatus: 'approved',
        status: 'active',
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const deleteAccountByAdmin = async (id: string): Promise<boolean> => {
  try {
    if (db.table('users')) {
      await db.table('users').delete(id);
      return true;
    }
  } catch {}
  return true;
};

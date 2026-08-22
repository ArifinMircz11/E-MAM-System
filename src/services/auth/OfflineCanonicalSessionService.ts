import { localDb } from '@/database/dexie';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { hashPassword } from '@/services/authService';
import { normalizeRoleStr } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import type { UserRole } from '@/types';

const FORBIDDEN_TENANTS = new Set(['', 'global', 'default', 'unknown', 'system']);

export interface OfflineSessionResult {
  success: boolean;
  role?: UserRole;
  error?: string;
  requiresPasswordChange?: boolean;
}

/**
 * Offline/mock authentication boundary.
 *
 * Local data is treated as cached identity material, never as an authorization
 * context. A successful offline session is impossible unless the same
 * SecurityContextService used by the online flow reaches READY.
 */
export const loginOfflineCanonical = async (
  identifier: string,
  password: string,
  options: { mock?: boolean } = {},
): Promise<OfflineSessionResult> => {
  const id = identifier.trim();
  if (!id) return { success: false, error: 'Identitas login wajib diisi.' };

  const idLower = id.toLowerCase();
  const foundLocalUser =
    await localDb.users.where('email').equalsIgnoreCase(idLower).first() ||
    await localDb.users.get(id) ||
    await localDb.users.where('idUnik').equalsIgnoreCase(idLower).first() ||
    await localDb.users.where('uid').equalsIgnoreCase(idLower).first();

  if (!foundLocalUser) {
    return { success: false, error: options.mock ? 'Akun simulasi tidak ditemukan.' : 'Akun belum pernah login di perangkat ini.' };
  }

  const tenantId = String(foundLocalUser.tenantId || '').trim();
  const referenceId = String(foundLocalUser.referenceId || '').trim();
  const uid = String(foundLocalUser.uid || foundLocalUser.id || '').trim();
  const status = String(foundLocalUser.status || (foundLocalUser as any).accountStatus || '').toLowerCase();

  if (!uid || FORBIDDEN_TENANTS.has(tenantId.toLowerCase()) || !referenceId) {
    SecurityContextService.clear();
    return { success: false, error: 'Identitas lokal tidak memiliki kontrak canonical yang lengkap.' };
  }

  if (status === 'suspended' || status === 'inactive') {
    SecurityContextService.clear();
    return { success: false, error: 'Akun Anda telah dinonaktifkan.' };
  }

  if (!options.mock) {
    const passwordHash = String((foundLocalUser as any).passwordHash || '');
    if (!passwordHash || passwordHash !== await hashPassword(password)) {
      SecurityContextService.clear();
      return { success: false, error: 'Password salah (Mode Offline).' };
    }
  }

  const role = normalizeRoleStr(foundLocalUser.role || (foundLocalUser as any).peran || foundLocalUser.roles?.[0] || 'SISWA');
  const roles = Array.isArray(foundLocalUser.roles) && foundLocalUser.roles.length > 0
    ? foundLocalUser.roles
    : [role];

  const canonicalUser = {
    uid,
    id: uid,
    tenantId,
    referenceId,
    role,
    roles,
    accountType: (foundLocalUser as any).accountType || 'madrasah',
    status: foundLocalUser.status || 'active',
    email: (foundLocalUser as any).email || (foundLocalUser as any).profile?.email || '',
    displayName: (foundLocalUser as any).displayName || (foundLocalUser as any).profile?.displayName || 'Pengguna Offline',
    permissions: (foundLocalUser as any).permissions || [],
    profile: (foundLocalUser as any).profile || {},
  } as any;

  try {
    SecurityContextService.setLifecycleState('AUTHENTICATED');
    SecurityContextService.initialize(canonicalUser);
    if (!SecurityContextService.isReady()) {
      throw new Error('OFFLINE_SECURITY_CONTEXT_NOT_READY');
    }

    const profileData: any = {
      ...canonicalUser,
      studentsId: (foundLocalUser as any).studentsId || null,
      teachersId: (foundLocalUser as any).teachersId || null,
      idUnik: (foundLocalUser as any).idUnik || null,
      photoURL: (foundLocalUser as any).photoURL || (foundLocalUser as any).profile?.photoURL || null,
      accountStatus: foundLocalUser.status || 'active',
    };

    // Stores are projections only and are updated after the authoritative
    // SecurityContext has been established.
    useAuthStore.getState().setUser(profileData);
    useAuthStore.getState().setAccountStatus(profileData.accountStatus);
    useUserStore.getState().setUserData({
      uid,
      role,
      roles,
      accountType: canonicalUser.accountType,
      referenceId,
      tenantId,
      status: canonicalUser.status,
    } as any);
    useProfileStore.getState().setProfile(profileData);

    return {
      success: true,
      role,
      requiresPasswordChange: Boolean((foundLocalUser as any).mustChangePassword),
    };
  } catch (error) {
    SecurityContextService.clear();
    SecurityContextService.setLifecycleState('ERROR', error instanceof Error ? error : String(error));
    return { success: false, error: 'Identitas offline gagal membentuk SecurityContext authoritative.' };
  }
};

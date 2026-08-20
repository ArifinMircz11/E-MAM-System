import { UserRole, AccountType } from '@/types/roles';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';

const DEVELOPER_EMAILS = ['developer@example.com', 'admin@example.com', 'mirzanovilawati@gmail.com'];

/**
 * Menormalisasi peran pengguna dari berbagai format string ke UserRole enum.
 * DILARANG melakukan fallback ke SISWA jika role tidak valid atau kosong.
 */
export const normalizeRoleStr = (roleStr: any, email?: string): UserRole | null => {
  const activeEmail = (email || '').toLowerCase().trim();
  if (activeEmail && DEVELOPER_EMAILS.includes(activeEmail)) {
    return UserRole.DEVELOPER;
  }
  if (!roleStr) return null;
  let str = roleStr;
  if (typeof roleStr === 'object' && roleStr !== null) {
    str = roleStr.role || roleStr.name || roleStr.value || JSON.stringify(roleStr);
  }
  const r = String(str).toLowerCase().trim();
  if (r === 'orang tua' || r === 'orangtua' || r === 'wali murid') return UserRole.ORANG_TUA;
  if (r === 'staf tu' || r === 'tata usaha') return UserRole.KEPALA_TU;
  if (r === 'kepala' || r === 'kepala sekolah' || r === 'kepala madrasah') return UserRole.KEPALA_MADRASAH;
  if (r === 'staff' || r === 'staf' || r === 'tenaga kependidikan') return UserRole.STAF;
  if (r === 'operator' || r === 'admin madrasah' || r === 'admin') return UserRole.ADMIN;
  if (r === 'pendidik' || r === 'guru' || r === 'teacher') return UserRole.GURU;
  if (r === 'wali kelas' || r === 'walikelas' || r === 'walas') return UserRole.WALI_KELAS;
  if (r === 'guru bk' || r === 'gurubk' || r === 'bk') return UserRole.GURU_BK;
  if (r === 'siswa' || r === 'student' || r === 'santri') return UserRole.SISWA;
  if (r === 'tamu' || r === 'guest') return UserRole.TAMU;
  if (r === 'developer' || r === 'dev') return UserRole.DEVELOPER;

  const validRoles = Object.values(UserRole) as string[];
  const normalized = r.replace(/\s+/g, '_');
  if (validRoles.includes(normalized)) {
    return normalized as UserRole;
  }

  return null;
};

/**
 * Canonical user roles and accountType normalization helper.
 * Enforces invariant:
 * 1. roles = unique, valid, non-empty list of roles
 * 2. primaryRole = roles[0]
 */
export const normalizeUserDataRoles = (data: any, email?: string): { roles: UserRole[]; accountType: AccountType; primaryRole: UserRole } => {
  const userEmail = (email || data?.email || '').toLowerCase().trim();
  const isDev = userEmail && DEVELOPER_EMAILS.includes(userEmail);

  if (isDev) {
    return {
      roles: [UserRole.DEVELOPER],
      accountType: AccountType.DEVELOPER,
      primaryRole: UserRole.DEVELOPER,
    };
  }

  // 1. Get raw potential roles
  const rawRoles = Array.isArray(data?.roles) ? data.roles : (data?.role || data?.peran ? [data.role || data.peran] : []);

  // 2. Normalize and filter roles
  const normalizedRoles = (rawRoles as any[])
    .map((r: any) => normalizeRoleStr(r, userEmail))
    .filter((r): r is UserRole => r !== null);

  // 3. Enforce: Unique roles
  const uniqueRoles = Array.from(new Set(normalizedRoles)) as UserRole[];
  
  if (uniqueRoles.length === 0) {
    throw new ArchitectureBoundaryError(
      'rbac',
      'RBAC_ACCESS_DENIED',
      `Identitas akun '${userEmail || data?.uid || 'unknown'}' tidak memiliki peran terdaftar yang valid. Fallback role dilarang.`
    );
  }

  // 4. Enforce: primaryRole = roles[0]
  const primaryRole = uniqueRoles[0];

  let accountType = data?.accountType as AccountType;
  if (!accountType || !Object.values(AccountType).includes(accountType)) {
    if (uniqueRoles.includes(UserRole.DEVELOPER)) {
      accountType = AccountType.DEVELOPER;
    } else {
      accountType = AccountType.MADRASAH;
    }
  }

  return {
    roles: uniqueRoles,
    accountType,
    primaryRole,
  };
};


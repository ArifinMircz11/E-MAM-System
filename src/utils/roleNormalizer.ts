import { UserRole, AccountType } from '@/types/roles';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';

/**
 * Normalizes an already-authoritative Firestore role into the application enum.
 *
 * IMPORTANT: this utility never derives a role from email and never supplies a
 * default role. Registration/guest classification belongs to the identity
 * resolver, not to role normalization.
 *
 * The optional second argument is retained only for source compatibility with
 * older callers. It is intentionally ignored and must never influence role
 * authority.
 */
export const normalizeRoleStr = (roleStr: any, _legacyContext?: unknown): UserRole | null => {
  if (!roleStr) return null;

  let str = roleStr;
  if (typeof roleStr === 'object' && roleStr !== null) {
    str = roleStr.role || roleStr.name || roleStr.value;
  }
  if (typeof str !== 'string' || str.trim() === '') return null;

  const r = str.toLowerCase().trim();
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
  return validRoles.includes(normalized) ? (normalized as UserRole) : null;
};

/**
 * Normalizes roles from an authoritative user document.
 * Missing/invalid roles are rejected; there is no email-based or default role.
 * The optional second argument is retained only for source compatibility and
 * is intentionally ignored.
 */
export const normalizeUserDataRoles = (
  data: any,
  _legacyContext?: unknown,
): { roles: UserRole[]; accountType: AccountType; primaryRole: UserRole } => {
  const rawRoles = Array.isArray(data?.roles)
    ? data.roles
    : data?.role || data?.peran
      ? [data.role || data.peran]
      : [];

  const normalizedRoles = (rawRoles as any[])
    .map((role) => normalizeRoleStr(role))
    .filter((role): role is UserRole => role !== null);

  const uniqueRoles = Array.from(new Set(normalizedRoles)) as UserRole[];

  if (uniqueRoles.length === 0) {
    throw new ArchitectureBoundaryError(
      'rbac',
      'RBAC_ACCESS_DENIED',
      `Identitas akun '${data?.uid || 'unknown'}' tidak memiliki peran terdaftar yang valid. Fallback role dilarang.`,
    );
  }

  const primaryRole = uniqueRoles[0];
  const accountType = data?.accountType as AccountType;

  if (!accountType || !Object.values(AccountType).includes(accountType)) {
    throw new ArchitectureBoundaryError(
      'user_contract',
      'ACCOUNT_TYPE_INVALID',
      `AccountType akun '${data?.uid || 'unknown'}' tidak berasal dari kontrak Firestore yang valid.`,
    );
  }

  return { roles: uniqueRoles, accountType, primaryRole };
};

import { UserRole } from '@/types/roles';

export const normalizeRole = (roleStr: string): UserRole => {
  const clean = roleStr?.trim()?.toLowerCase();
  switch (clean) {
    case 'developer':
    case 'dev':
      return UserRole.DEVELOPER;
    case 'admin':
    case 'administrator':
      return UserRole.ADMIN;
    case 'kepala_madrasah':
    case 'kamad':
      return UserRole.KEPALA_MADRASAH;
    case 'kepala_tu':
      return UserRole.KEPALA_TU;
    case 'staf':
    case 'staff':
    case 'staf_tu':
      return UserRole.STAF;
    case 'guru':
    case 'guru_mapel':
      return UserRole.GURU;
    case 'wali_kelas':
      return UserRole.WALI_KELAS;
    case 'guru_bk':
    case 'bk':
      return UserRole.GURU_BK;
    case 'siswa':
      return UserRole.SISWA;
    case 'orang_tua':
    case 'wali':
      return UserRole.ORANG_TUA;
    default:
      return UserRole.TAMU;
  }
};

export const normalizeRoleStr = normalizeRole;

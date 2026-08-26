/**
 * Definisi Role dan Scope Pengguna di IMAM System
 */

export enum UserRole {
  DEVELOPER = 'developer',
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ADMIN_MADRASAH = 'admin_madrasah',
  ADMIN_OPERASIONAL = 'admin_operasional',
  KEPALA_MADRASAH = 'kepala_madrasah', // Kamad
  KEPALA_TU = 'kepala_tu',
  GURU = 'guru',
  WALI_KELAS = 'wali_kelas',
  GURU_BK = 'guru_bk',
  BK = 'bk',
  STAF_TU = 'staf_tu',
  STAF = 'staf',
  GTK = 'gtk',
  KETUA_KELAS = 'ketua_kelas',
  SISWA = 'siswa',
  ORANG_TUA = 'orangtua',
  ALUMNI = 'alumni',
  TAMU = 'tamu',
  GUEST = 'guest',
  KESISWAAN = 'kesiswaan',
  PEMBINA_EKSKUL = 'pembina_ekskul',
  PIKET = 'piket',
  PENGURUS_ASRAMA = 'pengurus_asrama',
  KANWIL = 'kanwil',
  KEMENAG = 'kemenag',
}

export enum AccountType {
  GLOBAL = 'global',
  KANWIL = 'kanwil',
  KEMENAG = 'kemenag',
  MADRASAH = 'madrasah',
  STUDENT = 'student',
  TEACHER = 'teacher',
  GUEST = 'guest',
}

export const ADMIN_ROLES: UserRole[] = [
  UserRole.DEVELOPER,
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.ADMIN_MADRASAH,
  UserRole.ADMIN_OPERASIONAL,
];

export const STAFF_AND_GTK: UserRole[] = [
  UserRole.DEVELOPER,
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.ADMIN_MADRASAH,
  UserRole.KEPALA_MADRASAH,
  UserRole.KEPALA_TU,
  UserRole.STAF_TU,
  UserRole.STAF,
  UserRole.GTK,
  UserRole.GURU,
  UserRole.WALI_KELAS,
  UserRole.GURU_BK,
  UserRole.KESISWAAN,
];

export const STAFF_ABOVE: UserRole[] = [
  UserRole.DEVELOPER,
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.ADMIN_MADRASAH,
  UserRole.KEPALA_MADRASAH,
  UserRole.KEPALA_TU,
  UserRole.STAF_TU,
  UserRole.STAF,
  UserRole.GTK,
  UserRole.GURU,
  UserRole.WALI_KELAS,
  UserRole.GURU_BK,
  UserRole.ADMIN_OPERASIONAL,
];

export const ADMIN_DEV_ONLY: UserRole[] = [UserRole.DEVELOPER, UserRole.SUPER_ADMIN, UserRole.ADMIN];

export const ALL_ROLES = Object.values(UserRole);

export const ROLE_GROUPS = {
  ADMIN: ADMIN_ROLES,
  STAFF: STAFF_AND_GTK,
  DEV_ONLY: ADMIN_DEV_ONLY,
};

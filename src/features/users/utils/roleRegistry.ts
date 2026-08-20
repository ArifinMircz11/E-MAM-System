/**
 * @license
 * e-Mam System - Role Registry and i18n Dictionary
 * LAYER: UI / UTILS (Vertical Slice Architecture Compliant)
 */

import { UserRole, AccountType } from '@/types/roles';

export interface AccountTypeOption {
  value: AccountType;
  label: string;
}

export const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  { value: AccountType.MADRASAH, label: 'Madrasah' },
  { value: AccountType.KEMENAG, label: 'Kemenag (Kabupaten/Kota)' },
  { value: AccountType.KANWIL, label: 'Kanwil (Provinsi)' },
  { value: AccountType.DEVELOPER, label: 'Developer / Pengembang' },
];

export interface RoleMatrixEntry {
  validPrimaryRoles: UserRole[];
  validAdditionalRoles: UserRole[];
}

// Matrix mapping for AccountType (Organizational Level)
export const ACCOUNT_LEVEL_MATRIX: Record<AccountType, RoleMatrixEntry> = {
  [AccountType.DEVELOPER]: {
    validPrimaryRoles: [UserRole.DEVELOPER],
    validAdditionalRoles: [UserRole.ADMIN],
  },
  [AccountType.MADRASAH]: {
    validPrimaryRoles: [
      UserRole.GURU,
      UserRole.KEPALA_MADRASAH,
      UserRole.KEPALA_TU,
      UserRole.STAF,
      UserRole.SISWA,
      UserRole.ORANG_TUA,
      UserRole.ADMIN,
    ],
    validAdditionalRoles: [
      UserRole.WALI_KELAS,
      UserRole.WAKAMAD,
      UserRole.KESISWAAN,
      UserRole.KURIKULUM,
      UserRole.GTK,
      UserRole.GURU_BK,
      UserRole.STAF_TU,
      UserRole.BENDAHARA,
      UserRole.SARPRAS,
      UserRole.SATPAM,
      UserRole.KETUA_KELAS,
    ],
  },
  [AccountType.KANWIL]: {
    validPrimaryRoles: [UserRole.ADMIN, UserRole.STAF],
    validAdditionalRoles: [],
  },
  [AccountType.KEMENAG]: {
    validPrimaryRoles: [UserRole.ADMIN, UserRole.STAF],
    validAdditionalRoles: [],
  },
};

/**
 * Mendapatkan daftar peran (roles) utama yang valid berdasarkan jenis akun organisasi.
 */
export function getValidPrimaryRoles(type: AccountType): UserRole[] {
  return ACCOUNT_LEVEL_MATRIX[type]?.validPrimaryRoles || [];
}

/**
 * Mendapatkan daftar peran (roles) tambahan yang valid berdasarkan jenis akun organisasi.
 */
export function getValidAdditionalRoles(type: AccountType): UserRole[] {
  return ACCOUNT_LEVEL_MATRIX[type]?.validAdditionalRoles || [];
}

/**
 * roles.ts
 * Definisi Role di e-Mam System
 */

import { UserRole } from '@/types/roles';

export { UserRole };

export const RoleLabels: Record<UserRole, string> = {
  [UserRole.DEVELOPER]: 'Developer / System Engineer',
  [UserRole.SUPER_ADMIN]: 'Super Administrator',
  [UserRole.ADMIN]: 'Administrator Madrasah',
  [UserRole.ADMIN_MADRASAH]: 'Admin Madrasah',
  [UserRole.KEPALA_MADRASAH]: 'Kepala Madrasah',
  [UserRole.KEPALA_TU]: 'Kepala Tata Usaha',
  [UserRole.WAKAMAD]: 'Wakil Kepala Madrasah',
  [UserRole.KESISWAAN]: 'Wakamad Kesiswaan',
  [UserRole.KURIKULUM]: 'Wakamad Kurikulum',
  [UserRole.GTK]: 'Staf GTK',
  [UserRole.GURU]: 'Guru Mata Pelajaran',
  [UserRole.WALI_KELAS]: 'Wali Kelas',
  [UserRole.GURU_BK]: 'Guru Bimbingan Konseling',
  [UserRole.BK]: 'Guru BK (Legacy)',
  [UserRole.SISWA]: 'Siswa',
  [UserRole.ORANG_TUA]: 'Orang Tua / Wali',
  [UserRole.STAF]: 'Staf Madrasah',
  [UserRole.PUSTAKAWAN]: 'Pustakawan',
  [UserRole.LABORAN]: 'Laboran',
  [UserRole.PEMBINA_EKSKUL]: 'Pembina Ekstrakurikuler',
  [UserRole.HUMAS]: 'Staf Humas',
  [UserRole.PIKET]: 'Guru Piket',
  [UserRole.KOMITE]: 'Komite Madrasah',
  [UserRole.ALUMNI]: 'Alumni',
  [UserRole.PENGURUS_ASRAMA]: 'Pengurus Asrama',
  [UserRole.BENDAHARA]: 'Bendahara',
  [UserRole.SARPRAS]: 'Wakamad Sarpras',
  [UserRole.SATPAM]: 'Petugas Keamanan',
  [UserRole.PEMBINA_OSIS]: 'Pembina OSIS',
  [UserRole.TAMU]: 'Tamu / Pengunjung',
  [UserRole.STAF_TU]: 'Staf Tata Usaha',
  [UserRole.KETUA_KELAS]: 'Ketua Kelas',
  [UserRole.KANWIL]: 'Kanwil Kemenag',
  [UserRole.KANKEMENAG]: 'Kankemenag Kab/Kota',
  [UserRole.ADMIN_OPERASIONAL]: 'Admin Operasional',
};

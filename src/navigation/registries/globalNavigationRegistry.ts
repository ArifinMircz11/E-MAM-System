import type { NavigationNode } from '../contracts/navigation.types';

export const GLOBAL_NAVIGATION_REGISTRY: NavigationNode[] = [
  // --- DEVELOPER SCOPE ---
  {
    id: 'developer-console',
    title: 'Developer Console',
    path: 'dev_dashboard',
    icon: 'Terminal',
    section: 'DEVELOPER',
    access: {
      roles: ['developer'],
      organizationScopes: ['developer', 'global'],
    },
    order: 1,
  },
  {
    id: 'dev-global-settings',
    title: 'Global Settings',
    path: 'dev_system_settings',
    icon: 'Settings',
    section: 'DEVELOPER',
    access: {
      roles: ['developer'],
      organizationScopes: ['developer', 'global'],
    },
    order: 2,
  },
  {
    id: 'dev-system-monitor',
    title: 'System Monitor',
    path: 'dev_audit_log',
    icon: 'Activity',
    section: 'DEVELOPER',
    access: {
      roles: ['developer'],
      organizationScopes: ['developer', 'global'],
    },
    order: 3,
  },

  // --- KANWIL & KEMENAG SCOPE ---
  {
    id: 'kanwil-dashboard',
    title: 'Dashboard Kanwil',
    path: 'kanwil_dashboard',
    icon: 'Building2',
    section: 'KANWIL & KEMENAG',
    access: {
      roles: ['admin', 'kanwil', 'developer'],
      organizationScopes: ['kanwil', 'global'],
    },
    order: 10,
  },
  {
    id: 'kanwil-manajemen-kemenag',
    title: 'Satuan Kerja Kemenag',
    path: 'kanwil_satuan_kerja',
    icon: 'Globe',
    section: 'KANWIL & KEMENAG',
    access: {
      roles: ['admin', 'kanwil', 'developer'],
      organizationScopes: ['kanwil', 'global'],
    },
    order: 11,
  },
  {
    id: 'kemenag-dashboard',
    title: 'Dashboard Kemenag',
    path: 'kemenag_dashboard',
    icon: 'Building',
    section: 'KANWIL & KEMENAG',
    access: {
      roles: ['admin', 'kemenag', 'developer'],
      organizationScopes: ['kemenag', 'global'],
    },
    order: 12,
  },
  {
    id: 'kemenag-manajemen-madrasah',
    title: 'Layanan Kemenag Hub',
    path: 'kemenag_hub',
    icon: 'Building2',
    section: 'KANWIL & KEMENAG',
    access: {
      roles: ['admin', 'kemenag', 'kepala_madrasah', 'developer'],
      organizationScopes: ['kemenag', 'madrasah', 'global'],
    },
    order: 13,
  },

  // --- UTAMA ---
  {
    id: 'madrasah-dashboard',
    title: 'Beranda',
    path: 'dashboard',
    icon: 'LayoutDashboard',
    section: 'UTAMA',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'guru', 'staf', 'admin', 'siswa', 'orangtua', 'tamu', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 20,
  },

  // --- AKADEMIK ---
  {
    id: 'madrasah-jadwal',
    title: 'Jadwal KBM',
    path: 'schedule',
    icon: 'Calendar',
    section: 'AKADEMIK',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'guru', 'staf', 'admin', 'siswa', 'orangtua', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 30,
  },
  {
    id: 'madrasah-jurnal',
    title: 'Jurnal KBM',
    path: 'journal',
    icon: 'BookOpen',
    section: 'AKADEMIK',
    access: {
      roles: ['kepala_madrasah', 'guru', 'staf', 'admin', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 31,
  },
  {
    id: 'madrasah-tahun-akademik',
    title: 'Tahun Akademik',
    path: 'academic_year',
    icon: 'CalendarDays',
    section: 'AKADEMIK',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 32,
  },

  // --- PRESENSI ---
  {
    id: 'madrasah-presensi',
    title: 'Presensi Siswa',
    path: 'personal_attendance',
    icon: 'Clock',
    section: 'PRESENSI',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'guru', 'staf', 'admin', 'siswa', 'orangtua', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 40,
  },
  {
    id: 'madrasah-scanner',
    title: 'Scan QR Presensi',
    path: 'scanner',
    icon: 'QrCode',
    section: 'PRESENSI',
    access: {
      roles: ['kepala_madrasah', 'guru', 'staf', 'admin', 'siswa', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 41,
  },
  {
    id: 'madrasah-absensi-guru',
    title: 'Presensi Guru & Staf',
    path: 'teacher_attendance',
    icon: 'UserCheck',
    section: 'PRESENSI',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 42,
  },

  // --- MASTER DATA ---
  {
    id: 'madrasah-users',
    title: 'Manajemen User',
    path: 'users',
    icon: 'Users',
    section: 'MASTER DATA',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 50,
  },
  {
    id: 'madrasah-guru',
    title: 'Data Guru & GTK',
    path: 'teachers',
    icon: 'Briefcase',
    section: 'MASTER DATA',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 51,
  },
  {
    id: 'madrasah-siswa',
    title: 'Data Siswa',
    path: 'students',
    icon: 'GraduationCap',
    section: 'MASTER DATA',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'orangtua', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 52,
  },
  {
    id: 'madrasah-kelas',
    title: 'Data Kelas',
    path: 'classes',
    icon: 'Building',
    section: 'MASTER DATA',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 53,
  },
  {
    id: 'madrasah-profil',
    title: 'Profil Madrasah',
    path: 'madrasah_info',
    icon: 'Building2',
    section: 'MASTER DATA',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'siswa', 'orangtua', 'tamu', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 54,
  },

  // --- LAYANAN & PTSP ---
  {
    id: 'madrasah-surat',
    title: 'Surat Masuk & Keluar',
    path: 'letters',
    icon: 'Mail',
    section: 'LAYANAN',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'siswa', 'orangtua', 'tamu', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 60,
  },
  {
    id: 'madrasah-approval',
    title: 'Persetujuan Akun',
    path: 'account_approval',
    icon: 'CheckSquare',
    section: 'LAYANAN',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 61,
  },
  {
    id: 'madrasah-poin',
    title: 'Poin & Kedisiplinan',
    path: 'points',
    icon: 'Award',
    section: 'LAYANAN',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'siswa', 'orangtua', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 62,
  },

  // --- LAPORAN & LAINNYA ---
  {
    id: 'madrasah-laporan',
    title: 'Laporan & Rekap',
    path: 'reports',
    icon: 'BarChart3',
    section: 'SISTEM',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 70,
  },
  {
    id: 'madrasah-pesan',
    title: 'Pesan Chat',
    path: 'messages',
    icon: 'MessageSquare',
    section: 'SISTEM',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'siswa', 'orangtua', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 71,
  },
  {
    id: 'madrasah-semua-fitur',
    title: 'Semua Fitur',
    path: 'all_features',
    icon: 'LayoutGrid',
    section: 'SISTEM',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'siswa', 'orangtua', 'tamu', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 72,
  },
  {
    id: 'madrasah-pengaturan',
    title: 'Pengaturan & Profil',
    path: 'profile',
    icon: 'User',
    section: 'SISTEM',
    access: {
      roles: ['kepala_madrasah', 'kepala_tu', 'admin', 'staf', 'guru', 'siswa', 'orangtua', 'tamu', 'developer'],
      organizationScopes: ['madrasah', 'global'],
    },
    order: 73,
  },
];


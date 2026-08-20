import { ViewState, UserRole, ROLE_GROUPS } from '@/types';
import { FeatureNavItem } from './navigation.types';
import {
  QrCodeIcon,
  BookOpenIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  HomeIcon,
  InfoIcon,
  GlobeAltIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  UserIcon,
  ClockIcon,
  StarIcon,
  CogIcon,
  MessageCircleIcon,
  UserPlusIcon,
  LogOutIcon,
  ChartBarIcon,
  TerminalIcon,
  ShieldCheckIcon,
  KeyIcon,
  RefreshCwIcon,
  ShieldExclamationIcon,
  GraduationCapIcon,
} from '@/shared/Icons';

export const ALL_FEATURES_NAV: FeatureNavItem[] = [
  // --- MASTER DATA ---
  { label: 'Manage Users', icon: UsersIcon, view: ViewState.USERS, section: 'Master Data', roles: ROLE_GROUPS.ADMIN_LEVEL },
  { label: 'Master Madrasah', icon: BuildingLibraryIcon, view: ViewState.MADRASAH_MASTER, section: 'Master Data', roles: [UserRole.DEVELOPER, UserRole.ADMIN] },
  { label: 'Guru', icon: BriefcaseIcon, view: ViewState.TEACHERS, section: 'Master Data', roles: ROLE_GROUPS.MANAGEMENT },
  { label: 'Siswa', icon: UsersIcon, view: ViewState.STUDENTS, section: 'Master Data', roles: ROLE_GROUPS.STAFF_AND_GTK },
  { label: 'Kelas', icon: BuildingLibraryIcon, view: ViewState.CLASSES, section: 'Master Data', roles: ROLE_GROUPS.MANAGEMENT },
  { label: 'Tahun Akademik', icon: CalendarIcon, view: ViewState.ACADEMIC_YEAR, section: 'Master Data', roles: ROLE_GROUPS.MANAGEMENT },
  { label: 'Semester', icon: CalendarIcon, view: ViewState.SEMESTER, section: 'Master Data' },
  { label: 'Madrasah', icon: BuildingLibraryIcon, view: ViewState.MADRASAH_INFO, section: 'Master Data' },

  // --- AKADEMIK ---
  { label: 'Jadwal KBM', icon: CalendarDaysIcon, view: ViewState.SCHEDULE, section: 'Akademik' },
  { label: 'Jurnal', icon: BookOpenIcon, view: ViewState.JOURNAL, section: 'Akademik', roles: ROLE_GROUPS.ALL_GTK },
  { label: 'Kenaikan Kelas', icon: ChartBarIcon, view: ViewState.PROMOTION, section: 'Akademik', roles: ROLE_GROUPS.MANAGEMENT },
  { label: 'Tahun Akademik', icon: CalendarIcon, view: ViewState.ACADEMIC_YEAR, section: 'Akademik', roles: ROLE_GROUPS.MANAGEMENT },
  { label: 'Semester', icon: CalendarIcon, view: ViewState.SEMESTER, section: 'Akademik' },

  // --- PRESENSI ---
  { label: 'QR Scanner', icon: QrCodeIcon, view: ViewState.SCANNER, section: 'Presensi', roles: ROLE_GROUPS.ALL_GTK },
  { label: 'Presensi Siswa', icon: ClockIcon, view: ViewState.ATTENDANCE_HISTORY, section: 'Presensi', roles: ROLE_GROUPS.ALL },
  { label: 'Presensi Guru', icon: ClockIcon, view: ViewState.TEACHER_ATTENDANCE, section: 'Presensi', roles: ROLE_GROUPS.MANAGEMENT },

  // --- SURAT ---
  { label: 'Surat Masuk', icon: EnvelopeIcon, view: ViewState.LETTERS, section: 'Surat' },
  { label: 'Surat Keluar', icon: EnvelopeIcon, view: ViewState.LETTERS, section: 'Surat' },
  { label: 'Approval', icon: UserPlusIcon, view: ViewState.ACCOUNT_APPROVAL, section: 'Surat', roles: ROLE_GROUPS.MANAGEMENT },

  // --- POIN ---
  { label: 'Kategori Poin', icon: CogIcon, view: ViewState.POINT_CATEGORIES, section: 'Poin' },
  { label: 'Transaksi Poin', icon: StarIcon, view: ViewState.POINTS, section: 'Poin' },
  { label: 'Rekap Poin', icon: ChartBarIcon, view: ViewState.POINTS, section: 'Poin' },

  { label: 'Developer Console', icon: TerminalIcon, view: ViewState.DEVELOPER, section: 'Workspaces', roles: [UserRole.DEVELOPER] },

  // --- WORKSPACES ---
  { label: 'Dashboard Kanwil', icon: ChartBarIcon, view: ViewState.KANWIL_DASHBOARD, section: 'Workspaces', roles: [UserRole.DEVELOPER, UserRole.ADMIN, UserRole.KEPALA_MADRASAH] },
  { label: 'Layanan Kemenag', icon: BuildingLibraryIcon, view: ViewState.KEMENAG_HUB, section: 'Workspaces', roles: [UserRole.DEVELOPER, UserRole.ADMIN, UserRole.KEPALA_MADRASAH] },
  { label: 'Satuan Kerja Kemenag', icon: GlobeAltIcon, view: ViewState.KANWIL_SATUAN_KERJA, section: 'Workspaces', roles: [UserRole.DEVELOPER, UserRole.ADMIN] },
];

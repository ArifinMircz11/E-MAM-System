import {
  ShieldCheckIcon,
  AcademicCapIcon,
  UserIcon,
  UsersIcon,
  IdentificationIcon,
  ZapIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldExclamationIcon,
  CommandLineIcon,
  Squares2x2Icon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon,
  SparklesIcon,
  MegaphoneIcon,
  BellIcon,
  CogIcon,
} from '@/shared/Icons';
import { UserRole, ViewState } from '@/types';

export const roleLabels: Record<string, string> = {
  [UserRole.DEVELOPER]: 'Developer Platform',
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.KEPALA_MADRASAH]: 'Kepala Madrasah',
  [UserRole.KEPALA_TU]: 'Kepala TU',
  [UserRole.GURU]: 'Guru Mata Pelajaran',
  [UserRole.STAF]: 'Staf Kependidikan',
  [UserRole.SISWA]: 'Siswa',
  [UserRole.ORANG_TUA]: 'Wali Murid',
  [UserRole.WALI_KELAS]: 'Wali Kelas',
  [UserRole.GURU_BK]: 'Guru BK',
};

export const roleIcons: Record<string, any> = {
  [UserRole.DEVELOPER]: CommandLineIcon,
  [UserRole.ADMIN]: ShieldCheckIcon,
  [UserRole.KEPALA_MADRASAH]: AcademicCapIcon,
  [UserRole.GURU]: UserIcon,
  [UserRole.SISWA]: UsersIcon,
  [UserRole.ORANG_TUA]: IdentificationIcon,
};

export const getRoleScope = (role: string) => {
  const r = String(role || 'tamu').toLowerCase();
  
  if (r === 'developer') {
    return {
      symbol: '🛠️',
      label: 'Superuser',
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
      group: 'DEVELOPER_CORE'
    };
  }
  
  if (['admin', 'kepala_madrasah', 'kepala_tu', 'wakamad'].includes(r)) {
    return {
      symbol: '🏛️',
      label: 'Management',
      color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
      group: 'MANAGEMENT_CORE'
    };
  }
  
  if (['guru', 'wali_kelas', 'guru_bk', 'gtk'].includes(r)) {
    return {
      symbol: '👨‍🏫',
      label: 'Akademik',
      color: 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      group: 'TEACHER_CORE'
    };
  }
  
  return {
    symbol: '🎓',
    label: 'Personal',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    group: 'STUDENT_CORE'
  };
};

export const getCoreActions = (roles: UserRole[], pendingApprovalCount: number, unreadChatCount: number) => {
  const actions: any[] = [
    { label: 'Beranda', icon: Squares2x2Icon, view: ViewState.DASHBOARD, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Presensi', icon: ClipboardDocumentListIcon, view: ViewState.PERSONAL_ATTENDANCE, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  if (roles.some(r => ['developer', 'admin', 'kepala_madrasah', 'kepala_tu'].includes(r as string))) {
    actions.push({ label: 'Persetujuan', icon: ShieldCheckIcon, view: ViewState.ACCOUNT_APPROVAL, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', badge: pendingApprovalCount });
    actions.push({ label: 'Database', icon: UsersIcon, view: ViewState.USER_DATABASE, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' });
  }

  if (roles.some(r => ['developer', 'admin', 'guru', 'wali_kelas'].includes(r as string))) {
    actions.push({ label: 'Jurnal', icon: ClipboardDocumentListIcon, view: ViewState.JOURNAL, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' });
    actions.push({ label: 'Siswa', icon: UsersIcon, view: ViewState.STUDENTS, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' });
  }

  actions.push({ label: 'Surat', icon: EnvelopeIcon, view: ViewState.LETTERS, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' });
  actions.push({ label: 'Profil', icon: UserIcon, view: ViewState.PROFILE, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' });

  return actions;
};

import { ViewState } from '@/types';
import { SecurityContext, can } from '../auth/security-context';
import { MASTER_PERMISSIONS } from '../authorization/permission/MasterPermissionCatalog';

/**
 * NAVIGATION REGISTRY
 * 
 * Pengelola menu navigasi yang bersifat data-driven dan adaptif
 * terhadap SecurityContext (Permission & Role).
 */

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  view: ViewState;
  permission?: string;
  category: 'MAIN' | 'ACADEMIC' | 'ADMINISTRATION' | 'SETTINGS' | 'DEV';
}

export const MASTER_NAVIGATION: NavItem[] = [
  { id: 'dashboard', label: 'Beranda', icon: 'Home', view: ViewState.DASHBOARD, category: 'MAIN' },
  { id: 'students', label: 'Siswa', icon: 'Users', view: ViewState.STUDENTS, permission: MASTER_PERMISSIONS.STUDENT_VIEW, category: 'ACADEMIC' },
  { id: 'teachers', label: 'Guru', icon: 'UserSquare', view: ViewState.TEACHERS, permission: MASTER_PERMISSIONS.TEACHER_VIEW, category: 'ACADEMIC' },
  { id: 'classes', label: 'Kelas', icon: 'School', view: ViewState.CLASSES, permission: MASTER_PERMISSIONS.CLASS_VIEW, category: 'ACADEMIC' },
  { id: 'attendance', label: 'Presensi', icon: 'CalendarCheck', view: ViewState.ATTENDANCE_DASHBOARD, permission: MASTER_PERMISSIONS.ATTENDANCE_VIEW, category: 'ACADEMIC' },
  { id: 'letters', label: 'Persuratan', icon: 'FileText', view: ViewState.LETTERS, permission: MASTER_PERMISSIONS.LETTER_VIEW, category: 'ADMINISTRATION' },
  { id: 'dev_console', label: 'Developer', icon: 'Terminal', view: ViewState.DEVELOPER, permission: MASTER_PERMISSIONS.SYSTEM_MANAGE, category: 'DEV' },
];

/**
 * Mendapatkan daftar menu yang diizinkan untuk context saat ini.
 */
export function getAuthorizedNavigation(context: SecurityContext): NavItem[] {
  return MASTER_NAVIGATION.filter(item => {
    if (!item.permission) return true;
    return can(context, item.permission);
  });
}

/**
 * Mengelompokkan menu berdasarkan kategori.
 */
export function getGroupedNavigation(context: SecurityContext): Record<string, NavItem[]> {
  const items = getAuthorizedNavigation(context);
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);
}

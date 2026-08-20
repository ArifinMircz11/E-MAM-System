import { ViewState } from '@/types';
import { NavigationMenuGroup } from '../types/Navigation';

export const DEVELOPER_MENU_GROUPS: NavigationMenuGroup[] = [
  {
    title: 'SISTEM & GOVERNANCE',
    items: [
      { id: 'grid', viewState: ViewState.DEV_GRID, label: 'Grid Fitur (SEMUA)', iconName: 'LayoutGrid', category: 'system', roles: ['developer', 'super_admin'] },
      { id: 'overview', viewState: ViewState.DEV_DASHBOARD, label: 'Ringkasan Sistem', iconName: 'Home', category: 'system', roles: ['developer', 'super_admin'] },
      { id: 'broadcast', viewState: ViewState.DEV_BROADCAST, label: 'Siaran Sistem', iconName: 'Megaphone', category: 'system', roles: ['developer', 'super_admin', 'admin'] },
      { id: 'features', viewState: ViewState.DEV_FEATURES, label: 'Fitur & RBAC', iconName: 'Shield', category: 'governance', roles: ['developer', 'super_admin'] },
      { id: 'firestore_gov', viewState: ViewState.DEV_FIRESTORE_GOV, label: 'Firestore Governance', iconName: 'Flame', category: 'governance', roles: ['developer'] },
      { id: 'audit_test', viewState: ViewState.DEV_AUDIT_LOG, label: 'Audit & Test', iconName: 'Activity', category: 'governance', roles: ['developer', 'super_admin'] },
      { id: 'architecture', viewState: ViewState.DEV_ARCHITECTURE, label: 'Blueprint Arsitektur', iconName: 'Cpu', category: 'system', roles: ['developer', 'super_admin', 'admin'] },
    ],
  },
  {
    title: 'ORGANISASI & IAM',
    items: [
      { id: 'manajemen_organisasi', viewState: ViewState.DEV_MADRASAH, label: 'Organisasi Kanwil/Kemenag', iconName: 'Building2', category: 'organization', roles: ['developer', 'super_admin'] },
      { id: 'manajemen_madrasah', viewState: ViewState.DEV_MADRASAH, label: 'Daftar Madrasah', iconName: 'Briefcase', category: 'organization', roles: ['developer', 'super_admin', 'admin'] },
      { id: 'manajemen_user', viewState: ViewState.DEV_USERS, label: 'Pengguna Canonical (IAM)', iconName: 'Users', category: 'organization', roles: ['developer', 'super_admin'] },
      { id: 'tenant_mgmt', viewState: ViewState.TENANT_MANAGEMENT, label: 'Manajemen Tenant', iconName: 'Sliders', category: 'organization', roles: ['developer'] },
      { id: 'user_control', viewState: ViewState.DEV_USERS, label: 'Masuk Sebagai (Impersonation)', iconName: 'UserCheck', category: 'tools', roles: ['developer'] },
    ],
  },
  {
    title: 'DATA ENGINE & MIGRATION',
    items: [
      { id: 'schema_engine', viewState: ViewState.DEV_SCHEMA_ENGINE, label: 'Data & Schema Engine', iconName: 'Database', category: 'data', roles: ['developer'] },
      { id: 'master_version', viewState: ViewState.DEV_SYNC, label: 'Master Version & Migrasi', iconName: 'RefreshCw', category: 'data', roles: ['developer', 'super_admin'] },
      { id: 'attendance_control', viewState: ViewState.DEV_ATTENDANCE_CONTROL, label: 'Validasi Presensi', iconName: 'CheckSquare', category: 'tools', roles: ['developer', 'super_admin', 'admin'] },
      { id: 'dummy_engine', viewState: ViewState.DEV_DUMMY_ENGINE, label: 'Dummy Engine', iconName: 'Cpu', category: 'tools', roles: ['developer'] },
      { id: 'point_engine', viewState: ViewState.DEV_POINT_ENGINE, label: 'Point Engine', iconName: 'Sparkles', category: 'tools', roles: ['developer', 'super_admin', 'admin'] },
      { id: 'integration_test', viewState: ViewState.DEV_INTEGRATION_TEST, label: 'Integrasi WhatsApp', iconName: 'MessageSquare', category: 'tools', roles: ['developer', 'super_admin'] },
    ],
  },
];

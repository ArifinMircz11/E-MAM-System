import { DeveloperTabItem } from '../types/DeveloperTab';

export { TABEL_SISTEM, sccTabs } from '../components/DeveloperConsole/constants';

export const DEVELOPER_TABS: DeveloperTabItem[] = [
  { id: 'overview', label: 'Ringkasan Sistem', category: 'system' },
  { id: 'manajemen_organisasi', label: 'Manajemen Organisasi', category: 'organization' },
  { id: 'manajemen_user', label: 'Manajemen User (IAM)', category: 'organization' },
  { id: 'manajemen_madrasah', label: 'Manajemen Madrasah', category: 'organization' },
  { id: 'broadcast', label: 'Siaran Sistem', category: 'system' },
  { id: 'features', label: 'Pengaturan Fitur & RBAC', category: 'governance' },
  { id: 'master_version', label: 'Versi Master & Migrasi', category: 'data' },
  { id: 'schema_engine', label: 'Mesin & Penjelajah Skema', category: 'data' },
  { id: 'tenant_mgmt', label: 'Manajemen Tenant', category: 'organization' },
  { id: 'integration_test', label: 'Uji Integrasi (WA)', category: 'tools' },
  { id: 'user_control', label: 'Kontrol Pengguna & Penyamaran', category: 'tools' },
  { id: 'attendance_control', label: 'Validasi Kehadiran', category: 'tools' },
  { id: 'dummy_engine', label: 'Mesin Data Dummy', category: 'tools' },
  { id: 'point_engine', label: 'Poin Omni', category: 'tools' },
  { id: 'audit_test', label: 'Audit & Validasi Sistem', category: 'governance' },
  { id: 'firestore_gov', label: 'Firestore Governance', category: 'governance' },
  { id: 'architecture', label: 'Arsitektur & Blueprint', category: 'system' },
];

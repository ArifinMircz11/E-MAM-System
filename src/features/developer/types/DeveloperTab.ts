export type DeveloperTabKey =
  | 'grid'
  | 'overview'
  | 'broadcast'
  | 'features'
  | 'master_version'
  | 'schema_engine'
  | 'tenant_mgmt'
  | 'integration_test'
  | 'user_control'
  | 'attendance_control'
  | 'dummy_engine'
  | 'point_engine'
  | 'audit_test'
  | 'firestore_gov'
  | 'manajemen_organisasi'
  | 'manajemen_user'
  | 'manajemen_madrasah'
  | 'architecture'
  | 'logs'
  | 'database'
  | 'permissions'
  | 'migration';

export interface DeveloperTabItem {
  id: DeveloperTabKey;
  label: string;
  category: 'system' | 'organization' | 'data' | 'tools' | 'governance';
  icon?: string;
  badge?: string;
  badgeColor?: string;
}

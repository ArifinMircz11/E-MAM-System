export interface DashboardColumn {
  field: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'badge';
}

export interface DashboardStat {
  key: string;
  label: string;
  type: 'total' | 'active' | 'pending' | 'custom';
}

export interface DashboardMetadata {
  collection: string;
  title: string;
  icon?: string;
  columns: DashboardColumn[];
  stats: DashboardStat[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

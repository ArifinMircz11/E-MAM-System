import type { SyncStatus } from '@/types';

export interface TemplateItem {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  schemaVersion?: number;
  syncStatus: SyncStatus;
  deleted: boolean;
}

export interface TemplateFilterState {
  searchQuery: string;
  sortBy: 'name' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

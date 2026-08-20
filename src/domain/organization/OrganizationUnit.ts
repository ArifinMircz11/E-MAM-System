import { OrganizationLevelValue } from './OrganizationLevel';

export type OrganizationStatus = 'active' | 'inactive' | 'suspended';

export interface OrganizationUnit {
  id: string;
  parentId: string | null;
  level: OrganizationLevelValue;
  code: string;
  name: string;
  tenantId: string;
  status: OrganizationStatus;
  province?: string;
  regency?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

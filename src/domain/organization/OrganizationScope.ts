import { OrganizationLevelValue } from './OrganizationLevel';

export type ScopeType = 'ALL' | 'PROVINCE' | 'REGENCY' | 'MADRASAH';

export interface OrganizationScope {
  level: OrganizationLevelValue;
  scopeType: ScopeType;
  provinceCode?: string;
  regencyCode?: string;
  tenantId?: string;
  allowedTenantIds: string[];
}

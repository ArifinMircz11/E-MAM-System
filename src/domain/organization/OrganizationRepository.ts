import { OrganizationUnit } from './OrganizationUnit';
import { OrganizationScope } from './OrganizationScope';

export interface OrganizationRepository {
  findById(id: string): Promise<OrganizationUnit | null>;
  findByTenantId(tenantId: string): Promise<OrganizationUnit | null>;
  findByParentId(parentId: string): Promise<OrganizationUnit[]>;
  listAll(): Promise<OrganizationUnit[]>;
  create(unit: Omit<OrganizationUnit, 'createdAt' | 'updatedAt'>): Promise<OrganizationUnit>;
  update(id: string, updates: Partial<OrganizationUnit>): Promise<OrganizationUnit>;
  delete(id: string): Promise<boolean>;
  getScopeForUnit(unitId: string): Promise<OrganizationScope>;
}

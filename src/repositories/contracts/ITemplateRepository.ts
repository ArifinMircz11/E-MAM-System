import type { IRepository } from '../IRepository';
import type { SecurityContext } from '@/core/security/types';
import type { AppEntity } from '@/domain/entities/base';

export interface ITemplateEntity extends AppEntity {
  name: string;
  description: string;
}

export interface ITemplateRepository extends IRepository<ITemplateEntity> {
  findByTenant(context: SecurityContext, tenantId: string): Promise<ITemplateEntity[]>;
}

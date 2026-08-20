import { BaseRepository } from './BaseRepository';
import type { SubjectEntity } from '@/domain/entities/schedule';
import type { SecurityContext } from '@/core/security/types';

export class SubjectRepository extends BaseRepository<SubjectEntity> {
  constructor() {
    super('subjects');
  }

  async fetchByTenant(context: SecurityContext, tenantId: string): Promise<SubjectEntity[]> {
    this.validateContext(context, 'fetchByTenant');
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }
}

export const subjectRepository = new SubjectRepository();

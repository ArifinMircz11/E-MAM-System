import { BaseRepository } from './BaseRepository';
import type { ScheduleException } from '@/domain/entities/schedule';
import type { SecurityContext } from '@/core/security/types';

export class ScheduleExceptionRepository extends BaseRepository<ScheduleException> {
  constructor() {
    super('schedule_exceptions');
  }

  async fetchByTenant(context: SecurityContext, tenantId: string): Promise<ScheduleException[]> {
    this.validateContext(context, 'fetchByTenant');
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }
}

export const scheduleExceptionRepository = new ScheduleExceptionRepository();

import { BaseRepository } from './BaseRepository';
import type { ScheduleLog } from '@/domain/entities/schedule';
import type { SecurityContext } from '@/core/security/types';

export class ScheduleLogRepository extends BaseRepository<ScheduleLog> {
  constructor() {
    super('schedule_logs');
  }

  async fetchByTenant(context: SecurityContext, tenantId: string): Promise<ScheduleLog[]> {
    this.validateContext(context, 'fetchByTenant');
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }
}

export const scheduleLogRepository = new ScheduleLogRepository();

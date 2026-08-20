import { BaseRepository } from './BaseRepository';
import type { TimeSlot } from '@/domain/entities/schedule';
import type { SecurityContext } from '@/core/security/types';

export class TimeSlotRepository extends BaseRepository<TimeSlot> {
  constructor() {
    super('time_slots');
  }

  async fetchByTenant(context: SecurityContext, tenantId: string): Promise<TimeSlot[]> {
    this.validateContext(context, 'fetchByTenant');
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }
}

export const timeSlotRepository = new TimeSlotRepository();

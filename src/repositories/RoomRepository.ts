import { BaseRepository } from './BaseRepository';
import type { RoomEntity } from '@/domain/entities/schedule';
import type { SecurityContext } from '@/core/security/types';

export class RoomRepository extends BaseRepository<RoomEntity> {
  constructor() {
    super('rooms');
  }

  async fetchByTenant(context: SecurityContext, tenantId: string): Promise<RoomEntity[]> {
    this.validateContext(context, 'fetchByTenant');
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }
}

export const roomRepository = new RoomRepository();

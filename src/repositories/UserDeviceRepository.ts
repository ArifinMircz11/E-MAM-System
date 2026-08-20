import { BaseRepository } from './BaseRepository';
import type { SecurityContext } from '@/core/context/TenantContext';
import type { AppEntity } from '@/domain/entities/base';

export interface UserDevice extends AppEntity {
  userId: string;
  deviceId: string;
  deviceName: string;
  lastLoginAt: number;
}

export class UserDeviceRepository extends BaseRepository<UserDevice> {
  constructor() {
    super('user_devices');
  }

  async getDevicesByUserId(context: SecurityContext, userId: string): Promise<UserDevice[]> {
    return await this.table.where('userId').equals(userId).toArray();
  }
}

export const userDeviceRepository = new UserDeviceRepository();

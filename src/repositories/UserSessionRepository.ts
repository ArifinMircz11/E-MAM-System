import { BaseRepository } from './BaseRepository';
import type { SecurityContext } from '@/core/context/TenantContext';
import type { AppEntity } from '@/domain/entities/base';

export interface UserSession extends AppEntity {
  id: string;
  tenantId: string;
  userId: string;
  loginAt: number;
  logoutAt?: number;
  deviceId: string;
}

export class UserSessionRepository extends BaseRepository<UserSession> {
  constructor() {
    super('user_sessions');
  }

  async getSessionsByUserId(context: SecurityContext, userId: string): Promise<UserSession[]> {
    return await this.table.where('userId').equals(userId).toArray();
  }
}

export const userSessionRepository = new UserSessionRepository();

import { BaseRepository } from './BaseRepository';
import type { User } from '@/domain/entities/user';

export class UserApprovalRepository extends BaseRepository<User> {
  constructor() {
    super('user');
  }

  async fetchPendingRegistrations(tenantId: string): Promise<User[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((u) => u.status === 'pending')
      .toArray();
  }
}

export const userApprovalRepository = new UserApprovalRepository();

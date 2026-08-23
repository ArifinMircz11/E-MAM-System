import { BaseRepository } from './BaseRepository';
import type { LoginHistoryEntry } from '@/types';
import { syncRepository } from './SyncRepository';

export class LoginLogRepository extends BaseRepository<LoginHistoryEntry> {
  constructor() {
    super('loginLog');
  }

  async getByUserId(userId: string): Promise<LoginHistoryEntry[]> {
    return await this.table
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('timestamp');
  }

  async create(entity: LoginHistoryEntry): Promise<void> {
    await this.table.add(entity);
    // Login logs are synchronized to Firestore for security audit.
    await syncRepository.enqueue({
      tenantId: entity.tenantId,
      collection: 'login_logs',
      action: 'CREATE',
      payload: entity,
    });
  }
}

export const loginLogRepository = new LoginLogRepository();

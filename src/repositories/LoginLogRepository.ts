import { BaseRepository } from './BaseRepository';
import type { LoginHistoryEntry } from '@/types';
import { localDb } from '@/database/dexie';

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
    // Login logs are synchronized to Firestore for security audit
    await localDb.sync_queue.add({
      id: `sq_${Date.now()}_${entity.id}`,
      tenantId: entity.tenantId,
      collection: 'login_logs',
      recordId: entity.id,
      operation: 'create',
      payload: entity,
      createdAt: Date.now(),
      status: 'pending',
      attempts: 0,
    });
  }
}

export const loginLogRepository = new LoginLogRepository();

import { BaseRepository } from './base/BaseRepository';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface FaqFeedbackEntity extends AppEntity, Record<string, any> {
  id: string;
  faqId: string;
  userId: string;
  helpful: boolean;
  comment?: string;
}

export class FaqFeedbackRepository extends BaseRepository<FaqFeedbackEntity> {

  async findById(id: string, tenantId: string): Promise<FaqFeedbackEntity | null> {
    return (await this.table.where('id').equals(id).filter(f => f.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<FaqFeedbackEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: FaqFeedbackEntity): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: FaqFeedbackEntity): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(f => f.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }
}

export const faqFeedbackRepository = new FaqFeedbackRepository();

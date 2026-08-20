import { BaseRepository } from './base/BaseRepository';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface SupportConversationEntity extends AppEntity, Record<string, any> {
  id: string;
  npsn: string;
  ticketNumber: string;
  userId: string;
  agentId?: string;
  subject: string;
  categoryId: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat';
  status: 'Open' | 'Waiting' | 'On Progress' | 'Closed' | 'Escalated';
  startedAt: number;
  closedAt?: number;
  rating?: number;
}

export class SupportConversationRepository extends BaseRepository<SupportConversationEntity> {

  async findById(id: string, tenantId: string): Promise<SupportConversationEntity | null> {
    return (await this.table.where('id').equals(id).filter(c => c.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SupportConversationEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SupportConversationEntity): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SupportConversationEntity): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(c => c.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getByUser(tenantId: string, userId: string): Promise<SupportConversationEntity[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((c) => c.userId === userId)
      .toArray();
  }
}

export const supportConversationRepository = new SupportConversationRepository();

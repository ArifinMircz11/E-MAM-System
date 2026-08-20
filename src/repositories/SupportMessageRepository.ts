import { BaseRepository } from './base/BaseRepository';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface SupportMessageEntity extends AppEntity, Record<string, any> {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'system';
  message: string;
  messageType: 'text' | 'image' | 'pdf' | 'audio' | 'system';
  attachmentUrl?: string;
  isRead: boolean;
  sentAt: number;
  deliveredAt?: number;
  readAt?: number;
}

export class SupportMessageRepository extends BaseRepository<SupportMessageEntity> {
  constructor() {
    super('support_messages');
  }

  async findById(id: string, tenantId: string): Promise<SupportMessageEntity | null> {
    return (await this.table.where('id').equals(id).filter(m => m.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SupportMessageEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SupportMessageEntity): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SupportMessageEntity): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(m => m.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getMessagesByConversation(tenantId: string, conversationId: string): Promise<SupportMessageEntity[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((m) => m.conversationId === conversationId)
      .toArray()
      .then(items => items.sort((a, b) => a.sentAt - b.sentAt));
  }
}

export const supportMessageRepository = new SupportMessageRepository();

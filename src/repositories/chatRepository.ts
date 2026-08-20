import { BaseRepository } from './base/BaseRepository';
import type { SecurityContext } from '@/core/security/types';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface Chat extends AppEntity, Record<string, any> {
  id: string;
  tenantId: string;
  roomType: 'private' | 'group';
  participants: string[];
  lastMessage: string;
  lastTimestamp: any;
  unreadCount: Record<string, number>;
  participantDetails?: Record<string, any>;
}

/**
 * ChatRepository
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced via BaseRepository.
 */
export class ChatRepository extends BaseRepository<Chat> {

  async findById(id: string, tenantId: string): Promise<Chat | null> {
    return (await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Chat[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Chat): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: Chat): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {}

  async createChat(context: SecurityContext, data: Partial<Chat>): Promise<Chat> {
    await this.create(data as Chat);
    return data as Chat;
  }

  async updateChat(context: SecurityContext, id: string, data: Partial<Chat>): Promise<void> {
    const existing = await this.findById(id, context.tenantId);
    if (existing) {
      await this.update({ ...existing, ...data, updatedAt: Date.now() } as Chat);
    }
  }

  async getChatsByTenant(context: SecurityContext): Promise<Chat[]> {
    return await this.table.where('tenantId').equals(context.tenantId).toArray();
  }

  async getChatsByRoomType(context: SecurityContext, roomType: 'private' | 'group'): Promise<Chat[]> {
    return await this.table
      .where('[tenantId+roomType]')
      .equals([context.tenantId, roomType])
      .toArray();
  }

  async getChatById(context: SecurityContext, id: string): Promise<Chat | null> {
    return await this.getById(context, id);
  }
}

export const chatRepository = new ChatRepository();

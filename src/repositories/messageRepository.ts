import { BaseRepository } from './base/BaseRepository';
import type { SecurityContext } from '@/core/security/types';
import Dexie from 'dexie';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface Message extends AppEntity, Record<string, any> {
  id: string;
  tenantId: string;
  chatId: string;
  senderId: string;
  receiverId?: string;
  messageText: string;
  timestamp: any;
  isRead: boolean;
  status: string;
}

export class MessageRepository extends BaseRepository<Message> {

  async findById(id: string, tenantId: string): Promise<Message | null> {
    return (await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Message[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Message): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: Message): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {}

  async createMessage(context: SecurityContext, data: Partial<Message>): Promise<Message> {
    await this.create(data as Message);
    return data as Message;
  }

  async findByChatSorted(tenantId: string, chatId: string): Promise<Message[]> {
    const messages = await this.table.where('chatId').equals(chatId).filter(m => m.tenantId === tenantId).toArray();
    return messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }

  async getMessagesByChatId(tenantId: string, chatId: string): Promise<Message[]> {
    return await this.findByChatSorted(tenantId, chatId);
  }

  async deleteMessagesByChatId(chatId: string, tenantId: string): Promise<void> {
    await this.table.where('chatId').equals(chatId).filter(e => e.tenantId === tenantId).delete();
  }
}

export const messageRepository = new MessageRepository();

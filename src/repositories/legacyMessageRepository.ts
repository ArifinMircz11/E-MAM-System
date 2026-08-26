import { db } from '@/database/db';

export class LegacyMessageRepository {
  async getMessages(chatId: string): Promise<any[]> {
    try {
      if (db.table('class_chats')) {
        return await db.table('class_chats').where('conversationId').equals(chatId).toArray();
      }
    } catch {}
    return [];
  }

  async saveMessage(msg: any): Promise<boolean> {
    try {
      if (db.table('class_chats')) {
        await db.table('class_chats').put(msg);
        return true;
      }
    } catch {}
    return false;
  }

  async saveConversation(conv: any): Promise<boolean> {
    try {
      if (db.table('conversations')) {
        const item = Array.isArray(conv) ? conv[0] : conv;
        await db.table('conversations').put(item);
        return true;
      }
    } catch {}
    return false;
  }

  async addToQueue(op: string, payload: any): Promise<boolean> {
    try {
      if (db.table('sync_queue')) {
        await db.table('sync_queue').put({
          id: `msg_sync_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          operation: op,
          payload,
          createdAt: Date.now(),
          status: 'pending',
          retryCount: 0,
        });
        return true;
      }
    } catch {}
    return false;
  }

  async getConversations(tenantId: string): Promise<any[]> {
    try {
      if (db.table('conversations')) {
        return await db.table('conversations').where('tenantId').equals(tenantId).toArray();
      }
    } catch {}
    return [
      {
        id: 'AI_AGENT',
        tenantId,
        participants: ['AI_AGENT'],
        lastMessage: 'Halo! Saya asisten AI Anda.',
        lastMessageTimestamp: Date.now(),
        updatedAt: Date.now(),
      }
    ];
  }

  async getConversation(chatId: string): Promise<any | null> {
    try {
      if (db.table('conversations')) {
        return (await db.table('conversations').get(chatId)) || null;
      }
    } catch {}
    return null;
  }

  async deleteMessageLocal(messageId: string): Promise<boolean> {
    try {
      if (db.table('class_chats')) {
        await db.table('class_chats').delete(messageId);
        return true;
      }
    } catch {}
    return false;
  }

  async clearMessagesLocal(chatId: string): Promise<boolean> {
    try {
      if (db.table('class_chats')) {
        await db.table('class_chats').where('conversationId').equals(chatId).delete();
        return true;
      }
    } catch {}
    return false;
  }
}

export const legacyMessageRepository = new LegacyMessageRepository();
export const MessageRepository = legacyMessageRepository;

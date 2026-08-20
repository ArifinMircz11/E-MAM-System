/**
 * @license
 * e-Mam System - Message Repository
 * LAYER: REPOSITORY (Dexie Only Access - Architecture Compliant)
 */

import { localDb } from '@/database/dexie';

export const MessageRepository = {
  // --- Local Storage (Dexie) ---
  async getConversations(tenantId: string) {
    return await localDb.conversations
      .where('tenantId')
      .equals(tenantId)
      .reverse()
      .sortBy('lastMessageTimestamp');
  },

  async getConversation(id: string) {
    return await localDb.conversations.get(id);
  },

  async saveConversation(conversation: any | any[]) {
    const list = Array.isArray(conversation) ? conversation : [conversation];
    return await localDb.conversations.bulkPut(list);
  },

  async deleteConversationLocal(id: string) {
    return await localDb.transaction(
      'rw',
      [localDb.conversations, localDb.messages, localDb.messageParticipants],
      async () => {
        await localDb.conversations.delete(id);
        await localDb.messages.where('conversationId').equals(id).delete();
        await localDb.messageParticipants.where('conversationId').equals(id).delete();
      },
    );
  },

  async getMessages(conversationId: string) {
    return await localDb.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('createdAt');
  },

  async saveMessage(message: any | any[]) {
    const list = Array.isArray(message) ? message : [message];
    return await localDb.messages.bulkPut(list);
  },

  async deleteMessageLocal(id: string) {
    return await localDb.messages.delete(id);
  },

  async clearMessagesLocal(conversationId: string) {
    return await localDb.messages.where('conversationId').equals(conversationId).delete();
  },

  // --- Message Queue ---
  async addToQueue(action: string, payload: any) {
    return await localDb.messageQueue.add({
      id: `MSG_SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: action,
      payload,
      status: 'pending',
      createdAt: Date.now(),
    });
  },

  async getPendingQueue() {
    return await localDb.messageQueue.where('status').equals('pending').toArray();
  },
};


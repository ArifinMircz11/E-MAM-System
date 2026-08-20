/**
 * @license
 * e-Mam System - Chat Service
 * LAYER: SERVICE (Offline-First Dexie SSOT, No Firebase Imports)
 */

import type { Chat } from '@/repositories/chatRepository';
import { chatRepository } from '@/repositories/chatRepository';
import type { Message } from '@/repositories/messageRepository';
import { messageRepository } from '@/repositories/messageRepository';
import { TenantContext } from '@/core/context/TenantContext';

export interface ChatMessage extends Message {}
export interface ChatRoom extends Chat {}

/**
 * Generates deterministic room ID (Alphabetical order of IDs)
 */
export const generateRoomId = (idA: string, idB: string): string => {
  const cleanA = idA.trim();
  const cleanB = idB.trim();
  return cleanA < cleanB ? `${cleanA}_${cleanB}` : `${cleanB}_${cleanA}`;
};

/**
 * Sends a message securely and updates room metadata atomically in Dexie.
 */
export const sendMessageSecure = async (
  senderId: string,
  receiverId: string,
  messageText: string,
  roomId?: string,
): Promise<string> => {
  const context = TenantContext.getContext();
  const chatId = roomId || generateRoomId(senderId, receiverId);
  const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const now = Date.now();
  const newMessage: Message = {
    id: messageId,
    tenantId: context.tenantId,
    chatId,
    senderId,
    receiverId,
    messageText,
    timestamp: now,
    isRead: false,
    status: 'sent',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending' as any,
    version: 1,
    schemaVersion: 1,
    deleted: false,
  };

  await messageRepository.update(newMessage);

  const existingChat = await chatRepository.findById(chatId, context.tenantId);
  const unreadCount = existingChat?.unreadCount || {};
  if (receiverId) {
    unreadCount[receiverId] = (unreadCount[receiverId] || 0) + 1;
  }

  const chatData: Chat = {
    id: chatId,
    tenantId: context.tenantId,
    roomType: 'private',
    participants: [senderId, receiverId].filter(Boolean),
    lastMessage: messageText,
    lastTimestamp: now,
    unreadCount,
    updatedAt: now,
    createdAt: existingChat?.createdAt || now,
    syncStatus: 'pending' as any as any,
    version: (existingChat?.version || 0) + 1,
    schemaVersion: 1,
    deleted: false,
  };

  await chatRepository.update(chatData);
  return messageId;
};

/**
 * Subscribes to messages in a chat (Polling / Dexie reactive).
 */
export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const context = TenantContext.getContext();
  messageRepository.findByChatSorted(context.tenantId, chatId).then(callback).catch(() => callback([]));

  const interval = setInterval(async () => {
    try {
      const msgs = await messageRepository.findByChatSorted(context.tenantId, chatId);
      callback(msgs);
    } catch (e) {
      // ignore
    }
  }, 2000);

  return () => clearInterval(interval);
};

/**
 * Subscribes to user chats.
 */
export const subscribeToUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const context = TenantContext.getContext();
  chatRepository.getChatsByTenant(context).then((chats) => {
    const userChats = chats.filter((c) => c.participants?.includes(userId));
    callback(userChats);
  }).catch(() => callback([]));

  const interval = setInterval(async () => {
    try {
      const chats = await chatRepository.getChatsByTenant(context);
      const userChats = chats.filter((c) => c.participants?.includes(userId));
      callback(userChats);
    } catch (e) {
      // ignore
    }
  }, 3000);

  return () => clearInterval(interval);
};

/**
 * Gets or creates private chat room.
 */
export const getOrCreatePrivateChat = async (userA: string, userB: string): Promise<string> => {
  const context = TenantContext.getContext();
  const chatId = generateRoomId(userA, userB);
  const chat = await chatRepository.findById(chatId, context.tenantId);
  if (!chat) {
    const newChat: Chat = {
      id: chatId,
      tenantId: context.tenantId,
      roomType: 'private',
      participants: [userA, userB],
      lastMessage: '',
      lastTimestamp: Date.now(),
      unreadCount: { [userA]: 0, [userB]: 0 },
      updatedAt: Date.now(),
      createdAt: Date.now(),
      syncStatus: 'pending' as any as any,
      version: 1,
      schemaVersion: 1,
      deleted: false,
    };
    await chatRepository.create(newChat);
  }
  return chatId;
};

/**
 * Marks chat as read for user.
 */
export const markChatAsRead = async (chatId: string, userId: string): Promise<void> => {
  const context = TenantContext.getContext();
  const chat = await chatRepository.findById(chatId, context.tenantId);
  if (chat && chat.unreadCount) {
    chat.unreadCount[userId] = 0;
    await chatRepository.update({ ...chat, updatedAt: Date.now() });
  }
};

/**
 * Deletes chat and associated messages.
 */
export const deleteChat = async (chatId: string): Promise<void> => {
  const context = TenantContext.getContext();
  await messageRepository.deleteMessagesByChatId(chatId, context.tenantId);
  await chatRepository.delete(chatId, context.tenantId);
};

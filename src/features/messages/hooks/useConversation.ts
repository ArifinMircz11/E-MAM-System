import { useState, useCallback, useEffect } from 'react';
import { MessagingService } from '../services/MessagingService';
import { MessageRepository } from '@/repositories/legacyMessageRepository';
import type { Message } from '../components/types';

export function useConversation(chatId: string | null, tenantId: string, myIdUnik: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!chatId || !tenantId) return;
    setIsLoading(true);
    try {
      // Get from local
      const localMsgs = await MessageRepository.getMessages(chatId);
      setMessages(localMsgs as any);

      // Sync from firestore
      await MessagingService.getMessages(chatId, tenantId, true);
      const updatedMsgs = await MessageRepository.getMessages(chatId);
      setMessages(updatedMsgs as any);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [chatId, tenantId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!chatId || !myIdUnik || !tenantId) return;
      try {
        const newMsg = await MessagingService.sendMessage(chatId, myIdUnik, text, tenantId);
        setMessages((prev) => [...prev, newMsg as any]);
      } catch (err: any) {
        setError(err.message || 'Failed to send message');
      }
    },
    [chatId, myIdUnik, tenantId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!chatId || !tenantId) return;
      try {
        await MessagingService.deleteMessage(messageId, chatId, tenantId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err: any) {
        setError(err.message || 'Failed to delete message');
      }
    },
    [chatId, tenantId],
  );

  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId, loadMessages]);

  const clearChat = useCallback(async () => {
    if (!chatId || !tenantId) return;
    try {
      await MessagingService.clearChat(chatId, tenantId);
      setMessages([]);
    } catch (err: any) {
      setError(err.message || 'Failed to clear chat');
    }
  }, [chatId, tenantId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    clearChat,
    refreshMessages: loadMessages,
  };
}

import { useState, useCallback, useEffect } from 'react';
import { MessagingService } from '../services/MessagingService';
import { MessageRepository } from '@/repositories/legacyMessageRepository';
import { useAuthStore } from '@/stores/authStore';
import type { Chat } from '../components/types';

export function useMessages(tenantId: string) {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myIdUnik = user?.idUnik || null;

  const loadConversations = useCallback(async () => {
    if (!tenantId || !myIdUnik) return;
    setIsLoading(true);
    try {
      // Get from local first
      const localChats = await MessageRepository.getConversations(tenantId);
      setChats(localChats as any);

      // Sync from firestore in background
      const freshChats = await MessagingService.getConversations(myIdUnik, tenantId, true);
      if (freshChats && freshChats.length > 0) {
        setChats(freshChats as any);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, myIdUnik]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    chats,
    isLoading,
    error,
    myIdUnik,
    refreshConversations: loadConversations,
  };
}

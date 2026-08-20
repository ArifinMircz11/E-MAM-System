import { useState, useCallback } from 'react';
import type { AgentMessage } from '@/services/aiAgentService';
import { callAiAgent } from '@/services/aiAgentService';
import { toast } from 'sonner';

export const useAiAgent = (initialContext: any = {}) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState(initialContext);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: AgentMessage = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await callAiAgent(text, messages, context);

        if (response.error) {
          toast.error(response.error);
          // Optionally add an error message to the chat
          return;
        }

        const assistantMessage: AgentMessage = { role: 'assistant', content: response.text };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        toast.error('Gagal mengirim pesan ke Agent');
      } finally {
        setIsLoading(false);
      }
    },
    [messages, context, isLoading],
  );

  const resetChat = useCallback(() => {
    setMessages([]);
  }, []);

  const updateContext = useCallback((newContext: any) => {
    setContext((prev: any) => ({ ...prev, ...newContext }));
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    resetChat,
    updateContext,
  };
};

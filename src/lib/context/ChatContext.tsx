import type { ReactNode} from 'react';
import React, { createContext, useState, useContext } from 'react';

export const ChatContext = createContext<any>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(() => false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(() => false);
  const [isAgentOpen, setIsAgentOpen] = useState(() => false);
  const [chatData, setChatData] = useState<any>(() => null);

  const value = React.useMemo(
    () => ({
      isChatOpen,
      setIsChatOpen,
      isChatbotOpen,
      setIsChatbotOpen,
      isAgentOpen,
      setIsAgentOpen,
      chatData,
      setChatData,
    }),
    [isChatOpen, isChatbotOpen, isAgentOpen, chatData],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

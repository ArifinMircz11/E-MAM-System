import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChatbotHeader, ChatbotMessageList, ChatbotInput } from './';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  studentData?: any;
  schoolData?: any;
  onClose: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ studentData, schoolData, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `Halo! Saya asisten pintar e-Mam System. Ada yang bisa saya bantu terkait info akademik atau bantuan sistem?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: history,
          studentContext: sanitizeForJSON(studentData),
          schoolContext: sanitizeForJSON(schoolData),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
    } catch (err: any) {
      console.error('Chatbot response error:', err);
      toast.error(err.message || 'Gagal menghubungi AI');
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Maaf, terjadi kendala teknis saat menghubungi server AI. Silakan coba lagi nanti.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (window.confirm('Hapus riwayat chat ini?')) {
      setMessages([
        {
          role: 'model',
          text: `Halo! Saya asisten pintar e-Mam System. Ada yang bisa saya bantu?`,
        },
      ]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed ${isMaximized ? 'inset-4 z-[9999]' : 'bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[410px] h-[520px] max-h-[75vh] z-[9999]'} bg-white dark:bg-[#0B1121] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300`}
    >
      <ChatbotHeader
        onReset={resetChat}
        onMaximize={() => setIsMaximized(!isMaximized)}
        isMaximized={isMaximized}
        onClose={onClose}
      />
      <ChatbotMessageList messages={messages} isLoading={isLoading} />
      <ChatbotInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSend={handleSendMessage}
      />
    </motion.div>
  );
};

export default Chatbot;

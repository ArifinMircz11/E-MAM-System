import React, { useContext } from 'react';
import { ChatContext } from '@/lib/context/ChatContext';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from '@/shared/Icons';
import { useChatbotData } from '@/hooks/useChatbotData';
const Chatbot = React.lazy(() => import('./Chatbot').then(m => ({ default: m.Chatbot })));

export const ChatbotContainer = () => {
  const { isChatbotOpen, setIsChatbotOpen } = useContext(ChatContext);
  const user = useAuthStore((s) => s.user);

  const { studentData, schoolData } = useChatbotData(isChatbotOpen, user?.studentsId || undefined);

  if (!isChatbotOpen) return null;

  return (
    <React.Suspense
      fallback={
        <div className="fixed bottom-24 md:bottom-28 right-6 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl z-[9999]">
          <Loader2 className="animate-spin text-white w-6 h-6" />
        </div>
      }
    >
      <Chatbot
        onClose={() => setIsChatbotOpen(false)}
        studentData={studentData}
        schoolData={schoolData}
      />
    </React.Suspense>
  );
};

export default ChatbotContainer;

import React, { useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatContext } from '@/lib/context/ChatContext';
import { AiAgentPanel } from './AiAgentPanel';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';

export const AiAgentContainer: React.FC = () => {
  const { isAgentOpen, setIsAgentOpen } = useContext(ChatContext) || {};
  const tenantId = useUserStore((s) => s.tenantId);
  const profile = useProfileStore((s) => s.profile);

  if (!isAgentOpen) return null;

  return (
    <AnimatePresence>
      {isAgentOpen && (
        <AiAgentPanel onClose={() => setIsAgentOpen(false)} context={{ tenantId, profile }} />
      )}
    </AnimatePresence>
  );
};

export default AiAgentContainer;

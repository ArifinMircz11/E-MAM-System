import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { observeClassMessages, type ClassMessage } from '../services/classChatService';

export const useClassChat = (classId: string | undefined, activeTab: string) => {
  const [messages, setMessages] = useState<ClassMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const uid = useUserStore((state) => state.uid);
  const tenantId = useUserStore((state) => state.tenantId);
  const roles = useUserStore((state) => state.roles);
  const role = useUserStore((state) => state.role);
  const scope = useUserStore((state) => state.scope);

  useEffect(() => {
    if (!classId || activeTab !== 'obrolan' || !uid || !tenantId) {
      setMessages([]);
      return;
    }

    const context = {
      uid,
      tenantId,
      permissions: [],
      scope: scope || {},
      roles,
      role: role || undefined,
      isDeveloper: roles.includes('developer') || role === 'developer',
    };

    const unsubscribe = observeClassMessages(
      context,
      classId,
      (nextMessages) => {
        setMessages(nextMessages);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      (error) => {
        console.warn('Local class chat observation error:', error);
        setMessages([]);
      },
    );

    return unsubscribe;
  }, [classId, activeTab, uid, tenantId, roles, role, scope]);

  return { messages, chatBottomRef };
};

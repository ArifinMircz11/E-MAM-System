import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, limit, firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { type ClassMessage } from '../services/classChatService';
import { realtimeHub } from '../services/realtime/realtimeHub';

export const useClassChat = (classId: string | undefined, activeTab: string) => {
  const [messages, setMessages] = useState<ClassMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!classId || activeTab !== 'obrolan') {
      setMessages([]);
      return;
    }

    const todayDateStr = new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0];
    const path = `class_chats/${classId}/messages_${todayDateStr}`;
    const q = query(collection(firestoreGateway.db, path), orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as ClassMessage,
        );
        setMessages(msgs);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      (err) => {
        console.warn('Realtime listener error class chat:', err.message);
      },
    );

    realtimeHub.subscribe(`class-chat-${classId}`, unsubscribe);

    return () => {
      realtimeHub.unsubscribe(`class-chat-${classId}`);
    };
  }, [classId, activeTab]);

  return { messages, chatBottomRef };
};

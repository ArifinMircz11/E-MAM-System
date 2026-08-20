/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * High-Performance Throttled Real-time Listener Hook for Messages/Complaints
 */

import { useState, useEffect, useRef } from 'react';
import { onSnapshot, collection, orderBy, limit, query } from '@/services/dbGateway';
import { db } from '@/services/dbGateway';
import { realtimeHub } from '@/services/realtime/realtimeHub';

export interface LiveMessage {
  id: string;
  senderId: string;
  messageText: string;
  timestamp: any;
}

/**
 * useLiveComplaint Hook
 * Subscribes to complaint messages with 300ms throttling to avoid rapid-fire UI re-renders.
 */
export function useLiveComplaint(roomId: string, userSessionId: string) {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Buffer state to throttle quick successive writes
  const bufferRef = useRef<LiveMessage[]>([]);
  const isUpdatingRef = useRef(false);
  const throttleTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!userSessionId || !roomId || !db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, `chats/${roomId}/messages`),
      orderBy('timestamp', 'desc'),
      limit(20),
    );

    const flushBuffer = () => {
      isUpdatingRef.current = true;
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }

      throttleTimeoutRef.current = setTimeout(() => {
        // Balikkan urutan karena query desc
        setMessages([...bufferRef.current].reverse());
        isUpdatingRef.current = false;
        setIsLoading(false);
      }, 300);
    };

    const subscribe = () => {
      realtimeHub.unsubscribe(`live-complaint-${roomId}`);
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const logs: LiveMessage[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            logs.push({
              id: doc.id,
              senderId: data.senderId || data.studentsid || data.teachersid,
              messageText: data.messageText || '',
              timestamp: data.timestamp,
            });
          });

          bufferRef.current = logs;
          flushBuffer();
          setErrorBanner(null);
        },
        (err) => {
          console.warn('LiveComplaint subscription error, switching to offline fallback:', err);
          setErrorBanner('Akses luring aktif. Data diambil dari penyimpanan lokal.');
          setIsLoading(false);
        },
      );
      realtimeHub.subscribe(`live-complaint-${roomId}`, unsub);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        subscribe();
      } else {
        realtimeHub.unsubscribe(`live-complaint-${roomId}`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      realtimeHub.unsubscribe(`live-complaint-${roomId}`);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [roomId, userSessionId]);

  return { messages, errorBanner, isLoading };
}

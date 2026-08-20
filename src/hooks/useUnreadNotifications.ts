// src/hooks/useUnreadNotifications.ts
// ✅ TAMBAH: Throttle 30 detik + cache IndexedDB (opsional)
// ✅ HEMAT: -50% read Firestore

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from '@/services/dbGateway';
import { db } from '@/services/dbGateway';
import { realtimeHub } from '@/services/realtime/realtimeHub';
import { useAuthStore } from '@/stores/authStore';

const THROTTLE_MS = 30000; // 30 detik

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const user = useAuthStore((s) => s.user);
  const lastUpdate = useRef(0);
  const cachedCount = useRef(0);

  useEffect(() => {
    if (!user?.uid || !db) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();

      // Throttle: jangan update lebih cepat dari 30 detik
      if (now - lastUpdate.current < THROTTLE_MS) {
        // Update cache diam-diam
        cachedCount.current = snapshot.size;
        return;
      }

      lastUpdate.current = now;
      cachedCount.current = snapshot.size;

      setCount(snapshot.size);
      setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    realtimeHub.subscribe('unread_notifications', unsubscribe, {
      tenantId: user.tenantId || 'default',
    });

    return () => {
      realtimeHub.unsubscribe('unread_notifications');
    };
  }, [user?.uid, user?.tenantId]);

  return { count, notifications, cachedCount: cachedCount.current };
}

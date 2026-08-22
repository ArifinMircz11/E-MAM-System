// src/hooks/useUnreadNotifications.ts
// Offline-first: reads notification state from Dexie through the repository.

import { useState, useEffect, useRef } from 'react';
import { notificationRepository } from '@/repositories/notificationRepository';
import { useAuthStore } from '@/stores/authStore';

const REFRESH_MS = 30000;

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const user = useAuthStore((s) => s.user);
  const cachedCount = useRef(0);

  useEffect(() => {
    if (!user?.uid || !user.tenantId) {
      setCount(0);
      setNotifications([]);
      cachedCount.current = 0;
      return;
    }

    let disposed = false;

    const refresh = async () => {
      const rows = await notificationRepository.getByUserId(user.uid, user.tenantId);
      if (disposed) return;

      const unread = rows.filter((notification) => notification.isRead !== true);
      cachedCount.current = unread.length;
      setCount(unread.length);
      setNotifications(unread);
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_MS);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [user?.uid, user?.tenantId]);

  return { count, notifications, cachedCount: cachedCount.current };
}

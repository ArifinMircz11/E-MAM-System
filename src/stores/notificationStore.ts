import { create } from 'zustand';
import type { AppNotification } from '@/types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  unreadChatCount: number;
  pendingLetterCount: number;
  lastFetched: number | null;
  setNotifications: (notifications: AppNotification[]) => void;
  setUnreadCount: (count: number) => void;
  setUnreadChatCount: (count: number) => void;
  setPendingLetterCount: (count: number) => void;
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  unreadChatCount: 0,
  pendingLetterCount: 0,
  lastFetched: null,
  setNotifications: (notifications) =>
    set({
      notifications,
      lastFetched: Date.now(),
    }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  setUnreadChatCount: (unreadChatCount) => set({ unreadChatCount }),
  setPendingLetterCount: (pendingLetterCount) => set({ pendingLetterCount }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));

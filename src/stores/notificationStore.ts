import { create } from 'zustand';
export const useNotificationStore = create((set: any) => ({
  unreadCount: 0,
  unreadChatCount: 0,
  pendingLetterCount: 0,
  setUnreadCount: (count: number) => set({ unreadCount: count }),
  setUnreadChatCount: (count: number) => set({ unreadChatCount: count }),
}));

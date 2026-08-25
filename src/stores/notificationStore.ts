import { create } from 'zustand';
export const useNotificationStore = create(() => ({
  unreadCount: 0,
  unreadChatCount: 0,
  pendingLetterCount: 0
}));

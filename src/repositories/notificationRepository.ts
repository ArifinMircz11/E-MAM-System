import { db } from '@/database/db';

export interface NotificationEntity {
  id: string;
  tenantId: string;
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  read: boolean;
  type?: string;
  createdAt: number;
  updatedAt: number;
}

export const notificationRepository = {
  getNotifications: async (tenantId: string, userId?: string) => {
    try {
      if (!db.table('notifications')) return [];
      let query = db.table('notifications').where('tenantId').equals(tenantId);
      const list = await query.toArray();
      if (userId) {
        return list.filter((n: any) => !n.userId || n.userId === userId);
      }
      return list;
    } catch {
      return [];
    }
  },
  markAsRead: async (id: string) => {
    try {
      return await db.table('notifications').update(id, { read: true, updatedAt: Date.now() });
    } catch {
      return 0;
    }
  },
  save: async (notif: NotificationEntity) => {
    try {
      return await db.table('notifications').put(notif);
    } catch {
      return notif.id;
    }
  },
};

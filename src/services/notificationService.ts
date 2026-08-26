import { db } from '@/database/db';
import { AppNotification } from '@/types';

export const getNotificationCenterData = async (
  tenantId: string = 'tenant-demo',
  userId?: string
): Promise<any[]> => {
  try {
    if (db.table('notifications')) {
      const all = await db.table('notifications').toArray();
      if (all.length > 0) {
        return all.map((n) => ({
          ...n,
          isRead: n.isRead ?? n.read ?? false,
        }));
      }
    }
  } catch {}

  // Fallback default notifications
  return [
    {
      id: 'notif-1',
      tenantId,
      title: 'Selamat Datang di e-Mam System!',
      message: 'Sistem Manajemen Akademik Madrasah Terintegrasi siap digunakan.',
      type: 'info',
      isRead: false,
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'notif-2',
      tenantId,
      title: 'Pembaruan Jadwal UTS',
      message: 'UTS Semester Ganjil akan dimulai pada tanggal 14 September 2026.',
      type: 'info',
      isRead: false,
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'notif-3',
      tenantId,
      title: 'Pengajuan Surat Selesai',
      message: 'Surat Keterangan Aktif Belajar Anda telah disetujui.',
      type: 'surat',
      isRead: true,
      createdAt: Date.now() - 86400000,
    }
  ];
};

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    if (db.table('notifications')) {
      await db.table('notifications').update(id, { isRead: true, read: true, updatedAt: Date.now() });
    }
    return true;
  } catch {
    return false;
  }
};

export const sendNotification = async (payload: {
  title: string;
  message: string;
  type: string;
  targetRole?: string;
  targetClass?: string;
}): Promise<boolean> => {
  try {
    if (db.table('notifications')) {
      await db.table('notifications').put({
        id: `notif_${Date.now()}`,
        tenantId: '30315537',
        title: payload.title,
        message: payload.message,
        type: payload.type,
        targetRole: payload.targetRole || 'all',
        targetClass: payload.targetClass || 'all',
        isRead: false,
        read: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return true;
    }
  } catch {}
  return true;
};

export const requestNotificationPermission = async (): Promise<string> => {
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    return await Notification.requestPermission();
  }
  return 'granted';
};

export const initNotificationEventListeners = () => () => {};

export const notificationService = {
  getNotificationCenterData,
  requestNotificationPermission,
  markNotificationAsRead,
  sendNotification,
  initNotificationEventListeners,
};

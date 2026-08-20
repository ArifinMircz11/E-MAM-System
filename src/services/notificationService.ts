/**
 * @license
 * e-Mam System - Notification Service
 * LAYER: SERVICE (Architecture Compliant)
 */

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app, isMockMode } from './firebase';
import type { AppNotification} from '@/types';
import { UserRole } from '@/types';
import { notificationRepository } from '@/repositories/notificationRepository';
import { TenantContext } from '@/core/context/TenantContext';
import { CacheService } from './CacheService';
import { generateManualId } from '../utils/firestoreHelpers';

const COLLECTION = 'notifications';
const VAPID_KEY = 'nwSYOFFgv9YX_Ev0_AOIt25Rw657UfoZhB_RKhzS2_I';

/**
 * Requests browser notification permission and handles FCM token generation.
 */
export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  try {
    if (isMockMode) {
      console.log('[NotificationService] Running in Mock/Simulation Mode. Skipping browser notification permission request.');
      return null;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return null;

    const supported = await isSupported().catch(() => false);
    if (!supported) return null;

    if (Notification.permission === 'denied') return null;

    if (Notification.permission === 'granted') {
      return await getNotificationToken(userId);
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await getNotificationToken(userId);
    }
    return null;
  } catch (error) {
    console.error('[NotificationService] Permission request failed:', error);
    return null;
  }
};

const getNotificationToken = async (userId: string) => {
  try {
    if (isMockMode) return null;
    const messaging = getMessaging(app);
    let registration: ServiceWorkerRegistration | undefined;

    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.getRegistration();
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      const context = TenantContext.getContext();
      const { userRepository } = await import('@/repositories/userRepository');

      // Update FCM token via repository
      const user = await userRepository.findById(userId, context.tenantId);
      if (user) {
        await userRepository.update({
          ...user,
          fcmToken: token,
          lastTokenUpdate: new Date().toISOString(),
        } as any);
      }

      return token;
    }
  } catch (error) {
    console.warn('[NotificationService] FCM Token generation failed:', error);
  }
  return null;
};

/**
 * Marks a single notification as read.
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const context = TenantContext.getContext();

    // Repository save automatically handles local write + sync queue enrollment
    const notification = await notificationRepository.findById(notificationId, context.tenantId);
    if (notification) {
      await notificationRepository.update({ ...notification, isRead: true });
    }
  } catch (error) {
    console.error('[NotificationService] Mark as read failed:', error);
  }
};

/**
 * Fetches notifications with local-first strategy.
 */
export const getNotifications = async (forceRefresh = false): Promise<AppNotification[]> => {
  try {
    const context = TenantContext.getContext();
    const data = await CacheService.getCollection<AppNotification>(COLLECTION, {
      tenantId: context.tenantId,
      forceRefresh,
      keyField: 'id',
    });

    const results = data || [];

    // Filter by user or role permissions
    const userRoles = context.roles || (context.role ? [context.role] : []);
    const isAdmin = userRoles.some((r: string) =>
      [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.STAF].includes(r as any),
    );

    const filtered = results.filter((n) => {
      if (n.userId === context.uid) return true;
      if (n.targetRole === 'semua') return true;
      if (userRoles.includes(n.targetRole as any)) return true;
      if (isAdmin) return true;
      return false;
    });

    return filtered.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
  } catch (error) {
    console.error('[NotificationService] Fetch error:', error);
    return [];
  }
};

/**
 * Sends a notification (System or Personal).
 */
export const sendNotification = async (notif: Partial<AppNotification>): Promise<string> => {
  try {
    const context = TenantContext.getContext();
    const target = notif.userId || notif.targetRole || 'general';
    const manualId = generateManualId(`${context.tenantId}_${target}_${Date.now()}`);

    const newNotif: any = {
      ...notif,
      id: manualId,
      tenantId: context.tenantId,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    // Repository save automatically handles local write + sync queue enrollment
    await notificationRepository.create(newNotif as any);

    return manualId;
  } catch (error: any) {
    console.error('[NotificationService] sendNotification failed:', error);
    throw error;
  }
};

/**
 * Legacy support for NotificationBell.tsx
 */
export const getNotificationCenterData = async () => {
  return await getNotifications(false);
};

/**
 * FCM Push Listener
 */
export const setupOnMessageListener = (callback: (payload: any) => void) => {
  let unsub: (() => void) | undefined;

  if (isMockMode) {
    console.log('[NotificationService] Running in Mock/Simulation Mode. Skipping FCM listener setup.');
    return () => {};
  }

  isSupported()
    .then((supported) => {
      if (!supported) return;
      try {
        const messaging = getMessaging(app);
        unsub = onMessage(messaging, (payload) => {
          console.log('[NotificationService] FCM Message received:', payload);
          callback(payload);
        });
      } catch (err) {
        console.warn('[NotificationService] SW Listener setup failed:', err);
      }
    })
    .catch((err) => {
      console.warn('[NotificationService] FCM isSupported check failed:', err);
    });

  return () => {
    if (unsub) unsub();
  };
};

let isListenersInitialized = false;
 
/**
 * Event-driven notifications initialization.
 */
export const initNotificationEventListeners = () => {
  if (isListenersInitialized) return;
  isListenersInitialized = true;
 
  import('@/events/eventBus').then(({ eventBus }) => {
    // Point Notifications
    eventBus.subscribe('POINT_ADDED', async (event) => {
      const { pointRecord } = event.data;
      if (pointRecord) {
        await sendNotification({
          userId: pointRecord.studentsId,
          title: pointRecord.type === 'Prestasi' ? '🎉 Poin Prestasi' : '⚠️ Poin Pelanggaran',
          message: `Anda menerima ${pointRecord.points} poin untuk "${pointRecord.description}"`,
          type: 'transaksi',
        }).catch(() => {});
      }
    });

    // Attendance Notifications
    eventBus.subscribe('ATTENDANCE_RECORDED', async (event) => {
      const { record, details } = event.data;
      if (record) {
        await sendNotification({
          userId: record.studentsId,
          title: `📝 Presensi: ${record.statusGlobal}`,
          message: details || `Kehadiran dicatat sebagai "${record.statusGlobal}"`,
          type: 'transaksi',
        }).catch(() => {});
      }
    });
  });
};

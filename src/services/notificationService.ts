/**
 * @license
 * e-Mam System - Notification Service
 * LAYER: SERVICE (Architecture Compliant)
 */

import type { AppNotification } from '@/types';
import { UserRole } from '@/types';
import { notificationRepository } from '@/repositories/notificationRepository';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { CacheService } from './CacheService';
import { generateManualId } from '../utils/firestoreHelpers';
import { firebaseMessagingGateway } from './gateways/FirebaseMessagingGateway';
import { isMockMode } from './firebase';

const COLLECTION = 'notifications';
const VAPID_KEY = 'nwSYOFFgv9YX_Ev0_AOIt25Rw657UfoZhB_RKhzS2_I';

const requireContext = () => {
  if (!SecurityContextService.isReady()) throw new Error('NOTIFICATION_SECURITY_CONTEXT_NOT_READY');
  return SecurityContextService.getContext();
};

export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  try {
    if (isMockMode || typeof window === 'undefined' || !('Notification' in window)) return null;
    const context = requireContext();
    if (context.uid !== userId) throw new Error('NOTIFICATION_USER_MISMATCH');
    const supported = await firebaseMessagingGateway.isSupported().catch(() => false);
    if (!supported || Notification.permission === 'denied') return null;
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;
    }
    return await getNotificationToken(userId);
  } catch (error) {
    console.warn('[NotificationService] Permission request failed:', error);
    return null;
  }
};

const getNotificationToken = async (userId: string) => {
  try {
    if (isMockMode) return null;
    const context = requireContext();
    if (context.uid !== userId) throw new Error('NOTIFICATION_USER_MISMATCH');
    const messaging = firebaseMessagingGateway.getMessaging();
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    const token = await firebaseMessagingGateway.getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return null;
    const user = await notificationRepository.findById(userId, context.tenantId).catch(() => null);
    if (user) await notificationRepository.update({ ...user, fcmToken: token, lastTokenUpdate: new Date().toISOString() } as any);
    return token;
  } catch (error) {
    console.warn('[NotificationService] FCM Token generation failed:', error);
    return null;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const context = requireContext();
    const notification = await notificationRepository.findById(notificationId, context.tenantId);
    if (notification) await notificationRepository.update({ ...notification, isRead: true });
  } catch (error) {
    console.error('[NotificationService] Mark as read failed:', error);
  }
};

export const getNotifications = async (forceRefresh = false): Promise<AppNotification[]> => {
  try {
    const context = requireContext();
    const data = await CacheService.getCollection<AppNotification>(COLLECTION, { tenantId: context.tenantId, forceRefresh, keyField: 'id' });
    const results = data || [];
    const userRoles = context.roles || (context.role ? [context.role] : []);
    const isAdmin = userRoles.some((r: string) => [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.STAF].includes(r as any));
    return results.filter((n) => n.userId === context.uid || n.targetRole === 'semua' || userRoles.includes(n.targetRole as any) || isAdmin)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (error) {
    console.error('[NotificationService] Fetch error:', error);
    return [];
  }
};

export const sendNotification = async (notif: Partial<AppNotification>): Promise<string> => {
  const context = requireContext();
  const target = notif.userId || notif.targetRole || 'general';
  const id = generateManualId(`${context.tenantId}_${target}_${Date.now()}`);
  await notificationRepository.create({ ...notif, id, tenantId: context.tenantId, createdAt: new Date().toISOString(), isRead: false } as any);
  return id;
};

export const getNotificationCenterData = async () => getNotifications(false);

export const setupOnMessageListener = (callback: (payload: any) => void) => {
  let unsub: (() => void) | undefined;
  if (isMockMode) return () => {};
  firebaseMessagingGateway.isSupported().then((supported) => {
    if (!supported || !SecurityContextService.isReady()) return;
    try { unsub = firebaseMessagingGateway.onMessage(firebaseMessagingGateway.getMessaging(), callback); }
    catch (error) { console.warn('[NotificationService] SW Listener setup failed:', error); }
  }).catch(() => {});
  return () => { if (unsub) unsub(); };
};

let isListenersInitialized = false;
export const initNotificationEventListeners = () => {
  if (isListenersInitialized) return;
  isListenersInitialized = true;
  import('@/events/eventBus').then(({ eventBus }) => {
    eventBus.subscribe('POINT_ADDED', async (event) => {
      const { pointRecord } = event.data;
      if (pointRecord) await sendNotification({ userId: pointRecord.studentsId, title: pointRecord.type === 'Prestasi' ? '🎉 Poin Prestasi' : '⚠️ Poin Pelanggaran', message: `Anda menerima ${pointRecord.points} poin untuk "${pointRecord.description}"`, type: 'transaksi' }).catch(() => {});
    });
    eventBus.subscribe('ATTENDANCE_RECORDED', async (event) => {
      const { record, details } = event.data;
      if (record) await sendNotification({ userId: record.studentsId, title: `📝 Presensi: ${record.statusGlobal}`, message: details || `Kehadiran dicatat sebagai "${record.statusGlobal}"`, type: 'transaksi' }).catch(() => {});
    });
  });
};

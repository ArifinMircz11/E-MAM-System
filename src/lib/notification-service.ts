import axios from 'axios';
import { adminDb, adminMessaging } from './firebase-admin';
import { serverEnv } from '../core/config/serverEnv';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  targetUids?: string[];
  role?: string;
  whatsappTarget?: string;
}

export class NotificationService {
  /**
   * Send notification via multiple channels
   */
  static async notify(payload: NotificationPayload) {
    const tasks: Promise<any>[] = [];
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 1. WhatsApp Delivery
    if (payload.whatsappTarget && serverEnv.WHATSAPP_API_TOKEN) {
      tasks.push(this.sendWhatsApp(payload.whatsappTarget, payload.body, auditId, payload));
    }

    // 2. FCM Delivery (Web Push)
    if (payload.targetUids && payload.targetUids.length > 0) {
      tasks.push(
        this.sendPushByUids(payload.targetUids, payload.title, payload.body, auditId, payload.data),
      );
    }

    // 3. Role-based Delivery (e.g., notify all Guru BK)
    if (payload.role) {
      tasks.push(
        this.sendPushByRole(payload.role, payload.title, payload.body, auditId, payload.data),
      );
    }

    // 4. In-App Notification (Firestore)
    tasks.push(this.createInAppNotification(payload));

    return Promise.allSettled(tasks);
  }

  private static async logAudit(
    channel: 'WA' | 'PUSH',
    status: 'SUCCESS' | 'FAILED',
    error: string | null,
    auditId: string,
    payload: NotificationPayload,
  ) {
    try {
      await adminDb.collection('audit_notifications').add({
        auditId,
        timestamp: new Date().toISOString(),
        channel,
        status,
        error,
        recipient: payload.targetUids?.[0] || payload.whatsappTarget || 'system',
        title: payload.title,
        message: payload.body,
        category: payload.role
          ? `Role: ${payload.role}`
          : payload.whatsappTarget
            ? 'Parent Notify'
            : 'User Notification',
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }
  }

  private static async sendWhatsApp(
    target: string,
    message: string,
    auditId: string,
    payload: NotificationPayload,
  ) {
    try {
      const cleanTarget = target.replace(/[^0-9]/g, '');
      await axios.post(
        'https://api.fonnte.com/send',
        new URLSearchParams({
          target: cleanTarget,
          message: message,
        }).toString(),
        {
          headers: { Authorization: serverEnv.WHATSAPP_API_TOKEN || '' },
        },
      );
      await this.logAudit('WA', 'SUCCESS', null, auditId, payload);
    } catch (error: any) {
      const errMsg = error.response?.data?.reason || error.message;
      console.warn(`WhatsApp notification failed for ${target}:`, errMsg);
      await this.logAudit('WA', 'FAILED', errMsg, auditId, payload);
    }
  }

  private static async sendPushByUids(
    uids: string[],
    title: string,
    body: string,
    auditId: string,
    data?: any,
  ) {
    try {
      const tokens: string[] = [];
      const userSnaps = await Promise.all(
        uids.map((uid) => adminDb.collection('users').doc(uid).get()),
      );

      userSnaps.forEach((snap) => {
        const userData = snap.data();
        if (userData?.fcmTokens && Array.isArray(userData.fcmTokens)) {
          tokens.push(...userData.fcmTokens);
        }
      });

      if (tokens.length === 0) {
        await this.logAudit(
          'PUSH',
          'FAILED',
          'No registered FCM tokens found for user(s)',
          auditId,
          { title, body, targetUids: uids },
        );
        return;
      }

      const uniqueTokens = Array.from(new Set(tokens));

      await adminMessaging.sendEachForMulticast({
        tokens: uniqueTokens,
        notification: { title, body },
        data: data || {},
      });
      await this.logAudit('PUSH', 'SUCCESS', null, auditId, {
        title,
        body,
        targetUids: uids,
        data,
      });
    } catch (error: any) {
      console.warn('FCM Push failed:', error.message);
      await this.logAudit('PUSH', 'FAILED', error.message, auditId, {
        title,
        body,
        targetUids: uids,
        data,
      });
    }
  }

  private static async sendPushByRole(
    role: string,
    title: string,
    body: string,
    auditId: string,
    data?: any,
  ) {
    try {
      const usersWithRole = await adminDb.collection('users').where('role', '==', role).get();
      const uids = usersWithRole.docs.map((d: any) => d.id);
      if (uids.length > 0) {
        return this.sendPushByUids(uids, title, body, auditId, data);
      }
    } catch (error: any) {
      console.warn(`Role-based push failed for ${role}:`, error.message);
    }
  }

  private static async createInAppNotification(payload: NotificationPayload) {
    try {
      const notificationDoc = {
        title: payload.title,
        message: payload.body,
        date: new Date().toISOString(),
        type: 'alert',
        category: 'System Notification',
        sender: 'e-Mam System KERNEL',
        senderUid: 'system',
        recipientUid: payload.targetUids?.[0] || 'broadcast',
        isRead: false,
      };

      await adminDb.collection('notifications').add(notificationDoc);
    } catch (error: any) {
      console.warn('In-app notification creation failed:', error.message);
    }
  }
}

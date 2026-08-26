import { db } from '@/database/db';

export interface NotificationAuditLog {
  id: string;
  auditId: string;
  timestamp: string;
  channel: 'WA' | 'PUSH';
  status: 'SUCCESS' | 'FAILED';
  error: string | null;
  recipient: string;
  title: string;
  message: string;
  category: string;
  tenantId?: string;
}

export class NotificationLogRepository {
  async getLogs(context?: any, limit: number = 100): Promise<NotificationAuditLog[]> {
    try {
      const tenantId = context?.tenantId || 'tenant-demo';
      if (db.table('activity_logs')) {
        const logs = await db.table('activity_logs')
          .where('tenantId')
          .equals(tenantId)
          .filter(log => log.type === 'notification' || log.category === 'notification' || log.action?.includes('NOTIF'))
          .limit(limit)
          .toArray();

        if (logs.length > 0) {
          return logs.map((l: any) => ({
            id: l.id || `notif_log_${Math.random().toString(36).substring(2, 7)}`,
            auditId: l.auditId || `AUD-${l.id || Date.now()}`,
            timestamp: l.timestamp || new Date(l.createdAt || Date.now()).toISOString(),
            channel: l.channel || (l.action?.includes('WA') ? 'WA' : 'PUSH'),
            status: l.status === 'FAILED' ? 'FAILED' : 'SUCCESS',
            error: l.error || null,
            recipient: l.recipient || l.target || 'Seluruh Civitas',
            title: l.title || l.action || 'Notifikasi Sistem',
            message: l.message || l.details || '',
            category: l.category || 'INFORMASI',
            tenantId,
          }));
        }
      }

      // Default sample logs
      return [
        {
          id: 'log-1',
          auditId: 'AUD-NOTIF-001',
          timestamp: new Date().toISOString(),
          channel: 'PUSH',
          status: 'SUCCESS',
          error: null,
          recipient: 'Dewan Guru & Staf',
          title: 'Pengingat Presensi Pagi',
          message: 'Presensi kehadiran otomatis dibuka mulai pukul 06.30 WIB.',
          category: 'PRESENSI',
          tenantId,
        },
        {
          id: 'log-2',
          auditId: 'AUD-NOTIF-002',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          channel: 'WA',
          status: 'SUCCESS',
          error: null,
          recipient: 'Wali Murid Kelas X-A',
          title: 'Laporan Kehadiran Harian',
          message: 'Laporan kehadiran siswa telah terkirim via WhatsApp Gateway.',
          category: 'AKADEMIK',
          tenantId,
        },
      ];
    } catch {
      return [];
    }
  }

  async saveLog(log: Partial<NotificationAuditLog>): Promise<void> {
    try {
      if (db.table('activity_logs')) {
        await db.table('activity_logs').put({
          ...log,
          type: 'notification',
          createdAt: Date.now(),
        });
      }
    } catch {}
  }
}

export const notificationLogRepository = new NotificationLogRepository();

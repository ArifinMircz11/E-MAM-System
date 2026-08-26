import { db } from '@/database/db';

export class AuditRepository {
  async log(entry: any) {
    try {
      if (db.table('audit_logs')) {
        await db.table('audit_logs').put({
          ...entry,
          id: entry.id || `audit_${Date.now()}`,
          timestamp: Date.now(),
        });
      }
    } catch {}
  }
}

export const auditRepository = new AuditRepository();

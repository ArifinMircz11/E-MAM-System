import { db } from '@/database/db';

export const getLoginHistory = async (uid: string): Promise<any[]> => {
  try {
    if (db.table('audit_logs')) {
      const logs = await db.table('audit_logs')
        .filter((l: any) => l.uid === uid || l.createdBy === uid)
        .toArray();
      if (logs.length > 0) {
        return logs.map((l: any) => ({
          id: l.id,
          device: l.lastModifiedDevice || l.device || 'Chrome - macOS',
          ip: l.ip || '182.253.14.88',
          status: l.status || 'Success',
          timestamp: l.createdAt || Date.now(),
        }));
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Fallback / mock data
  return [
    {
      id: 'h-1',
      device: 'Chrome - Windows',
      ip: '182.253.14.88',
      status: 'Success',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'h-2',
      device: 'Safari - iPhone',
      ip: '182.253.14.88',
      status: 'Success',
      timestamp: Date.now() - 86400000,
    }
  ];
};

export const historyService = {
  getHistory: async (tenantId: string = 'tenant-demo') => {
    try {
      if (db.table('attendance')) {
        return await db.table('attendance').where('tenantId').equals(tenantId).toArray();
      }
      return [];
    } catch {
      return [];
    }
  },
  getLoginHistory,
};

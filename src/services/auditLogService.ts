import { db } from '@/database/db';

export interface AuditLogItem {
  id: string;
  tenantId: string;
  action: string;
  category: string;
  performedBy: string;
  targetId?: string;
  details?: any;
  timestamp: number;
}

export const logAudit = async (
  action: string,
  category: string = 'SYSTEM',
  details: any = {},
  tenantId: string = 'tenant-demo',
  performedBy: string = 'system'
) => {
  try {
    const entry: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      action,
      category,
      performedBy,
      details,
      timestamp: Date.now(),
    };
    if (db.table('audit_logs')) {
      await db.table('audit_logs').put(entry);
    }
    return entry;
  } catch (e) {
    return null;
  }
};

export const auditLog = logAudit;

export const getAuditLogs = async (tenantId: string = 'tenant-demo', limit: number = 50) => {
  try {
    if (!db.table('audit_logs')) return [];
    return await db.table('audit_logs').where('tenantId').equals(tenantId).reverse().limit(limit).toArray();
  } catch {
    return [];
  }
};

export const getAuditLogsPaginated = async (
  tenantId: string = 'tenant-demo',
  lastDoc: any = null,
  limitNumber: number = 15
): Promise<{ data: AuditLogItem[]; lastDoc: any | null }> => {
  try {
    if (!db.table('audit_logs')) return { data: [], lastDoc: null };
    
    let all = await db.table('audit_logs').where('tenantId').equals(tenantId).reverse().toArray();
    let startIndex = 0;
    
    if (lastDoc) {
      startIndex = all.findIndex((item) => item.id === lastDoc) + 1;
      if (startIndex <= 0) startIndex = 0;
    }
    
    const paginated = all.slice(startIndex, startIndex + limitNumber);
    const nextLastDoc = paginated.length > 0 ? paginated[paginated.length - 1].id : null;
    
    return {
      data: paginated,
      lastDoc: nextLastDoc,
    };
  } catch {
    return { data: [], lastDoc: null };
  }
};

export const initPointAuditListeners = () => () => {};
export const initUserAuditListeners = () => () => {};

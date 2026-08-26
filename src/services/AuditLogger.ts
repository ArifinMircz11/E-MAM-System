import { logAudit, getAuditLogs } from './auditLogService';

export class AuditLogger {
  static async log(action: string, category: string = 'SYSTEM', details: any = {}, tenantId: string = 'tenant-demo', performedBy: string = 'system') {
    return await logAudit(action, category, details, tenantId, performedBy);
  }
}

export const auditService = {
  log: logAudit,
  getLogs: getAuditLogs,
};

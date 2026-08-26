import { logAudit, getAuditLogs } from './auditLogService';

export const auditService = {
  log: logAudit,
  getLogs: getAuditLogs,
};

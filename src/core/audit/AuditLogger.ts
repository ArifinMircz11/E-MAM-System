export type AuditEventType =
  | 'BootStarted'
  | 'DatabaseReady'
  | 'MigrationStarted'
  | 'MigrationCompleted'
  | 'HealthEvaluated'
  | 'SafeModeActivated'
  | 'SyncEnabled'
  | 'SyncBlocked';

export interface AuditLogEntry {
  id: string;
  event: AuditEventType;
  tenantId: string | null;
  healthScore?: number;
  details?: string;
  timestamp: string;
}

class AuditLoggerManager {
  private logs: AuditLogEntry[] = [];

  public log(event: AuditEventType, tenantId: string | null, healthScore?: number, details?: string): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event,
      tenantId,
      healthScore,
      details,
      timestamp: new Date().toISOString()
    };

    this.logs.push(entry);
    console.log(`[AUDIT_LOG] [${entry.event}] Tenant: ${entry.tenantId || 'GLOBAL'} | Score: ${entry.healthScore ?? 'N/A'} | ${entry.details || ''}`);
    return entry;
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }
}

export const auditLogger = new AuditLoggerManager();

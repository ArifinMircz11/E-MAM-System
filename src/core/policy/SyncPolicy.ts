import type { HealthReport, RuntimeMode } from '../bootstrap/BootContext';

export interface PolicyEvaluationResult {
  allowed: boolean;
  runtimeMode: RuntimeMode;
  reason: string;
  actionRequired?: string;
}

export class SyncPolicy {
  public static evaluate(healthReport: HealthReport): PolicyEvaluationResult {
    const score = healthReport.score;

    if (score >= 90) {
      return {
        allowed: true,
        runtimeMode: 'SYNC_ACTIVE',
        reason: 'Health score is optimal (>= 90). Delta synchronization fully enabled.'
      };
    } else if (score >= 70) {
      return {
        allowed: true,
        runtimeMode: 'SAFE_MODE_QUEUE',
        reason: 'Health score is acceptable (70-89). Local mutation queue active, sync throttled.'
      };
    } else if (score >= 40) {
      return {
        allowed: false,
        runtimeMode: 'SAFE_MODE_READ',
        reason: 'Health score is degraded (40-69). Read-only mode activated; synchronization blocked.'
      };
    } else {
      return {
        allowed: false,
        runtimeMode: 'EMERGENCY',
        reason: 'Critical health failure (< 40). Emergency mode; all syncing and mutating blocked.',
        actionRequired: 'Run local database diagnostic and verify migration checkpoint rollback.'
      };
    }
  }
}

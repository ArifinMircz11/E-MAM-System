import type { HealthReport } from '../bootstrap/BootContext';
import type { PolicyEvaluationResult } from './SyncPolicy';
import { SyncPolicy } from './SyncPolicy';
import { auditLogger } from '../audit/AuditLogger';

export class PolicyEngine {
  public static evaluateRuntimePolicy(healthReport: HealthReport, tenantId: string | null): PolicyEvaluationResult {
    const evaluation = SyncPolicy.evaluate(healthReport);

    if (!evaluation.allowed) {
      auditLogger.log('SyncBlocked', tenantId, healthReport.score, evaluation.reason);
    } else {
      auditLogger.log('SyncEnabled', tenantId, healthReport.score, evaluation.reason);
    }

    return evaluation;
  }
}

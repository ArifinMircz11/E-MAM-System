/**
 * @license
 * e-Mam System - ESAF Work Order Generator
 */

import type { ESAFEvidence, WorkOrder, SeverityLevel } from '../types';

export class WOGenerator {
  public static generateWorkOrders(violations: ESAFEvidence[]): WorkOrder[] {
    const groupedByRule: Record<string, ESAFEvidence[]> = {};

    for (const v of violations) {
      // Only generate WOs for ERROR and CRITICAL
      if (v.severity === 'CRITICAL' || v.severity === 'ERROR') {
        if (!groupedByRule[v.ruleId]) {
          groupedByRule[v.ruleId] = [];
        }
        groupedByRule[v.ruleId].push(v);
      }
    }

    const workOrders: WorkOrder[] = [];
    let index = 1;

    for (const [ruleId, evs] of Object.entries(groupedByRule)) {
      const affectedFiles = Array.from(new Set(evs.map(e => e.filePath)));
      const highestSeverity: SeverityLevel = evs.some(e => e.severity === 'CRITICAL') ? 'CRITICAL' : 'ERROR';
      
      const wo: WorkOrder = {
        woId: `WO-ESAF-${String(index++).padStart(3, '0')}-${ruleId.toUpperCase()}`,
        title: `Remediate rule violation: ${ruleId}`,
        targetRule: ruleId,
        severity: highestSeverity,
        affectedFiles,
        objective: `Resolve all violations of rule ${ruleId} across ${affectedFiles.length} file(s) to restore architectural compliance.`,
        steps: evs.map(e => `Fix ${e.filePath}:${e.line} -> ${e.recommendation}`),
        acceptanceCriteria: [
          `Zero violations of ${ruleId} detected by ESAF engine`,
          `All affected files pass layer & offline contracts`,
          `Build and typecheck pass green`
        ]
      };

      workOrders.push(wo);
    }

    return workOrders;
  }
}

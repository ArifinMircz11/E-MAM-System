/**
 * @license
 * e-Mam System - Architecture Governance Types
 * LAYER: SCRIPTS / GOVERNANCE
 */

export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface GovernanceRule {
  id: string;
  enabled: boolean;
  severity: Severity;
  description: string;
}

export interface AuditContext {
  projectRoot: string;
  manifestRules: GovernanceRule[];
}

export interface Violation {
  ruleId: string;
  filePath: string;
  severity: Severity;
  message: string;
  line?: number;
  column?: number;
}

export interface AuditResult {
  timestamp: string;
  passed: boolean;
  violationsCount: {
    INFO: number;
    WARNING: number;
    ERROR: number;
    CRITICAL: number;
  };
  violations: Violation[];
}

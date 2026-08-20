/**
 * @license
 * e-Mam System - ESAF v1.0 Contracts & Types
 */

export type RuleCategory =
  | 'architecture'
  | 'dependency'
  | 'offline'
  | 'repository'
  | 'service'
  | 'hook'
  | 'store'
  | 'sync'
  | 'security'
  | 'performance'
  | 'testing'
  | 'build'
  | 'adr';

export type SeverityLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface ESAFEvidence {
  ruleId: string;
  filePath: string;
  line: number;
  column: number;
  severity: SeverityLevel;
  evidence: string;
  recommendation: string;
}

export interface ESAFRule {
  id: string;
  name: string;
  category: RuleCategory;
  severity: SeverityLevel;
  description: string;
  analyze(context: ESAFContext): Promise<ESAFEvidence[]> | ESAFEvidence[];
}

export interface GovernanceRule {
  id: string;
  enabled: boolean;
}

export interface ESAFContext {
  projectRoot: string;
  project: any; // ts-morph Project
  enabledRules: string[];
}

export interface ViolationCount {
  INFO: number;
  WARNING: number;
  ERROR: number;
  CRITICAL: number;
}

export interface WorkOrder {
  woId: string;
  title: string;
  targetRule: string;
  severity: SeverityLevel;
  affectedFiles: string[];
  objective: string;
  steps: string[];
  acceptanceCriteria: string[];
}

export interface ESAFReport {
  timestamp: string;
  passed: boolean;
  architectureScore: number; // 0 - 100
  violationsCount: ViolationCount;
  violations: ESAFEvidence[];
  workOrders: WorkOrder[];
}

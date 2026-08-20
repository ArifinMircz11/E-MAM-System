/**
 * @license
 * e-Mam System - Migration Types & Interfaces
 */

export interface MigrationRule {
  version: number;
  name: string;
  description: string;
  collection: string;
  migrate: (doc: any, dryRun?: boolean) => Promise<{ transformed: any; changed: boolean }>;
}

export interface MigrationMetadata {
  version: number;
  executedAt: string;
  executedBy: string;
  status: 'success' | 'failed' | 'skipped' | 'rollback';
  duration: number;
  checksum: string;
}

export interface MigrationAuditLog {
  documentId: string;
  collection: string;
  before: any;
  after: any;
  migrationVersion: number;
  duration: number;
  status: 'success' | 'failed' | 'skipped' | 'rollback';
  timestamp: string;
  error?: string;
}

export interface MigrationReportSummary {
  version: number;
  collection: string;
  totalDocuments: number;
  migrated: number;
  skipped: number;
  failed: number;
  rollback: number;
  executionTimeMs: number;
  executionTimeString: string;
  auditLogs: MigrationAuditLog[];
}

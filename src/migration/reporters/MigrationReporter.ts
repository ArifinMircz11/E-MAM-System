/**
 * @license
 * e-Mam System - Migration Reporter
 */

import * as fs from 'fs';
import * as path from 'path';
import type { MigrationReportSummary } from '../types';

export class MigrationReporter {
  static generateReports(summary: MigrationReportSummary) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const jsonPath = path.join(reportsDir, 'migration-report.json');
    const mdPath = path.join(reportsDir, 'migration-report.md');

    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');

    const mdContent = `
# Enterprise Migration Report

========================================
Migration Version : ${summary.version}
Collection : ${summary.collection}
Total Documents : ${summary.totalDocuments}
Migrated : ${summary.migrated}
Skipped : ${summary.skipped}
Failed : ${summary.failed}
Rollback : ${summary.rollback}
Execution Time : ${summary.executionTimeString} (${summary.executionTimeMs}ms)
========================================

## Audit Log Summary
Total Audit Entries: ${summary.auditLogs.length}
`;

    fs.writeFileSync(mdPath, mdContent.trim(), 'utf-8');

    console.log(`\n========================================`);
    console.log(`Enterprise Migration Report`);
    console.log(`========================================`);
    console.log(`Migration Version : ${summary.version}`);
    console.log(`Collection        : ${summary.collection}`);
    console.log(`Total Documents   : ${summary.totalDocuments}`);
    console.log(`Migrated          : ${summary.migrated}`);
    console.log(`Skipped           : ${summary.skipped}`);
    console.log(`Failed            : ${summary.failed}`);
    console.log(`Rollback          : ${summary.rollback}`);
    console.log(`Execution Time    : ${summary.executionTimeString}`);
    console.log(`========================================\n`);
  }
}

/**
 * @license
 * e-Mam System - Migration Engine
 */

import { MigrationRegistry } from './MigrationRegistry';
import { MigrationValidator } from '../validators/MigrationValidator';
import { MigrationAudit } from '../audit/MigrationAudit';
import { RollbackService } from '../rollback/RollbackService';
import { MigrationReporter } from '../reporters/MigrationReporter';
import type { MigrationReportSummary, MigrationAuditLog } from '../types';

export class MigrationEngine {
  static async runCollectionMigration(
    collection: string,
    documents: any[],
    dryRun = false,
  ): Promise<MigrationReportSummary> {
    const startTime = Date.now();
    const rules = MigrationRegistry.getRulesForCollection(collection);
    const rule = rules[rules.length - 1]; // Latest version rule

    const version = rule ? rule.version : 2;
    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    let rollbackCount = 0;
    const auditLogs: MigrationAuditLog[] = [];

    for (const doc of documents) {
      const docId = doc.id || doc.tenantId || 'unknown_id';
      RollbackService.saveSnapshot(docId, doc);

      try {
        const currentVersion = doc.schemaVersion || 1;
        if (currentVersion >= version && doc.accountType && doc.role) {
          skipped++;
          continue;
        }

        let transformed = doc;
        let changed = false;

        if (rule) {
          const res = await rule.migrate(doc, dryRun);
          transformed = res.transformed;
          changed = res.changed;
        }

        // Validate
        const validation = MigrationValidator.validateGeneric(transformed, collection);
        if (!validation.valid) {
          failed++;
          const rollbackDoc = RollbackService.getSnapshot(docId);
          rollbackCount++;
          auditLogs.push({
            documentId: docId,
            collection,
            before: doc,
            after: rollbackDoc,
            migrationVersion: version,
            duration: 0,
            status: 'rollback',
            timestamp: new Date().toISOString(),
            error: validation.errors.join(', '),
          });
          continue;
        }

        if (changed) {
          migrated++;
        } else {
          skipped++;
        }

        const auditLog: MigrationAuditLog = {
          documentId: docId,
          collection,
          before: doc,
          after: transformed,
          migrationVersion: version,
          duration: 0,
          status: dryRun ? 'skipped' : 'success',
          timestamp: new Date().toISOString(),
        };

        MigrationAudit.record(auditLog);
        auditLogs.push(auditLog);
      } catch (err: any) {
        failed++;
        rollbackCount++;
        auditLogs.push({
          documentId: docId,
          collection,
          before: doc,
          after: doc,
          migrationVersion: version,
          duration: 0,
          status: 'rollback',
          timestamp: new Date().toISOString(),
          error: err.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    const executionTimeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const summary: MigrationReportSummary = {
      version,
      collection,
      totalDocuments: documents.length,
      migrated,
      skipped,
      failed,
      rollback: rollbackCount,
      executionTimeMs: duration,
      executionTimeString,
      auditLogs,
    };

    MigrationReporter.generateReports(summary);
    return summary;
  }
}

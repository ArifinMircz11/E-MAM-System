/**
 * @license
 * e-Mam System - Rollback Service
 */

import type { MigrationAuditLog } from '../types';

export class RollbackService {
  private static snapshots: Map<string, any> = new Map();

  static saveSnapshot(documentId: string, originalDoc: any) {
    this.snapshots.set(documentId, JSON.parse(JSON.stringify(originalDoc)));
  }

  static getSnapshot(documentId: string): any {
    return this.snapshots.get(documentId);
  }

  static rollbackLog(log: MigrationAuditLog): any {
    const original = this.snapshots.get(log.documentId);
    if (original) {
      return original;
    }
    return log.before;
  }
}

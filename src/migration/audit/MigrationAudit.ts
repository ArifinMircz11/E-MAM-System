/**
 * @license
 * e-Mam System - Migration Audit
 */

import type { MigrationAuditLog } from '../types';

export class MigrationAudit {
  private static logs: MigrationAuditLog[] = [];

  static record(log: MigrationAuditLog) {
    this.logs.push(log);
  }

  static getLogs(): MigrationAuditLog[] {
    return this.logs;
  }

  static clear() {
    this.logs = [];
  }
}

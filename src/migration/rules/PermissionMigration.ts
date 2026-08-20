/**
 * @license
 * e-Mam System - Permission Migration Rule
 */

import { MigrationRegistry } from '../engine/MigrationRegistry';
import type { MigrationRule } from '../types';

export const PermissionMigration: MigrationRule = {
  version: 2,
  name: 'Permission Normalization V2',
  description: 'Normalize permission definitions and resource.action format',
  collection: 'permissions',
  migrate: async (doc: any, dryRun = false) => {
    let changed = false;
    let code = doc.code || doc.name;
    if (code && !code.includes('.') && doc.resource && doc.action) {
      code = `${doc.resource}.${doc.action}`;
      changed = true;
    }

    const transformed = {
      ...doc,
      code,
      resource: doc.resource || code?.split('.')[0] || 'general',
      action: doc.action || code?.split('.')[1] || 'read',
      schemaVersion: 2,
      migration: {
        version: 2,
        executedAt: new Date().toISOString(),
        executedBy: 'MigrationEngine',
        status: dryRun ? 'skipped' : 'success',
        duration: 0,
        checksum: 'permission_v2',
      },
    };
    return { transformed, changed };
  },
};

MigrationRegistry.register(PermissionMigration);

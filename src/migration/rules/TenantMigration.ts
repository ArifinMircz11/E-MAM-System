/**
 * @license
 * e-Mam System - Tenant Migration Rule
 */

import { MigrationRegistry } from '../engine/MigrationRegistry';
import type { MigrationRule } from '../types';

export const TenantMigration: MigrationRule = {
  version: 2,
  name: 'Tenant Normalization V2',
  description: 'Normalize tenant records and enforce multi-tenant isolation standards',
  collection: 'tenants',
  migrate: async (doc: any, dryRun = false) => {
    const changed = !doc.tenantId || doc.schemaVersion < 2;
    const transformed = {
      ...doc,
      id: doc.id || doc.tenantId || 'tenant_man_1_surakarta',
      tenantId: doc.tenantId || doc.id || 'tenant_man_1_surakarta',
      status: doc.status || 'active',
      schemaVersion: 2,
      migration: {
        version: 2,
        executedAt: new Date().toISOString(),
        executedBy: 'MigrationEngine',
        status: dryRun ? 'skipped' : 'success',
        duration: 0,
        checksum: 'tenant_v2',
      },
    };
    return { transformed, changed };
  },
};

MigrationRegistry.register(TenantMigration);

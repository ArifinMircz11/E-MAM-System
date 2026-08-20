/**
 * @license
 * e-Mam System - Migration Runner
 */

import './MigrationRegistry';
import '../rules/UserMigrationV2';
import '../rules/TenantMigration';
import '../rules/PermissionMigration';
import { MigrationEngine } from './MigrationEngine';

export class MigrationRunner {
  static async run(targetCollection?: string, dryRun = false) {
    console.log(`[MigrationRunner] Starting migration (Target: ${targetCollection || 'all'}, DryRun: ${dryRun})...`);

    // Sample data for CLI execution if no DB connected
    const sampleUsers = [
      { id: 'usr_1', email: 'developer@example.com', role: 'developer', tenantId: 'system', schemaVersion: 1 },
      { id: 'usr_2', email: 'admin@madrasah.id', role: 'admin', tenantId: 'tenant_man_1_surakarta', schemaVersion: 1 },
      { id: 'usr_3', email: 'guru@madrasah.id', role: 'teacher', isWaliKelas: true, tenantId: 'tenant_man_1_surakarta', schemaVersion: 1 },
      { id: 'usr_4', email: 'siswa@madrasah.id', role: 'student', tenantId: 'tenant_man_1_surakarta', schemaVersion: 2 },
    ];

    const sampleTenants = [
      { id: 'tenant_man_1_surakarta', name: 'MAN 1 Surakarta', schemaVersion: 1 },
    ];

    const samplePermissions = [
      { id: 'perm_1', resource: 'user', action: 'read', schemaVersion: 1 },
    ];

    const collectionsToMigrate = targetCollection ? [targetCollection] : ['users', 'tenants', 'permissions'];

    for (const col of collectionsToMigrate) {
      let docs: any[] = [] as any[];
      if (col === 'users') docs = sampleUsers;
      else if (col === 'tenants') docs = sampleTenants;
      else if (col === 'permissions') docs = samplePermissions;

      await MigrationEngine.runCollectionMigration(col, docs, dryRun);
    }

    console.log('[MigrationRunner] Migration completed successfully.');
  }
}

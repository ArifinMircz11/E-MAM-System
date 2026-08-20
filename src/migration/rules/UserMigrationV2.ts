/**
 * @license
 * e-Mam System - User Migration V2 Rule
 */

import { MigrationRegistry } from '../engine/MigrationRegistry';
import type { MigrationRule } from '../types';

export const UserMigrationV2: MigrationRule = {
  version: 2,
  name: 'Canonical User V2',
  description: 'Normalize user documents to Canonical User Schema v2 adhering to Architecture Freeze v7.8',
  collection: 'users',
  migrate: async (doc: any, dryRun = false) => {
    const before = JSON.parse(JSON.stringify(doc));
    let changed = false;

    // FASE 2: Role Mapping Table & AccountType normalization
    const rawRole = (doc.role || doc.userRole || 'siswa').toLowerCase().trim();
    let accountType = doc.accountType;

    const isDeveloperTarget = doc.email === 'admin@example.com' || doc.email === 'developer@example.com' || doc.uid === 'C8Xb8vh93KgbSAXq8Qj1';

    const roleMapping: Record<string, { role: string; accountType: 'developer' | 'madrasah'; level: 'global' | 'tenant' }> = {
      developer: { role: 'developer', accountType: 'developer', level: 'global' },
      admin: { role: 'admin', accountType: 'madrasah', level: 'tenant' },
      administrator: { role: 'admin', accountType: 'madrasah', level: 'tenant' },
      kamad: { role: 'kamad', accountType: 'madrasah', level: 'tenant' },
      headmaster: { role: 'kamad', accountType: 'madrasah', level: 'tenant' },
      'kepala madrasah': { role: 'kamad', accountType: 'madrasah', level: 'tenant' },
      keptu: { role: 'keptu', accountType: 'madrasah', level: 'tenant' },
      'kepala tu': { role: 'keptu', accountType: 'madrasah', level: 'tenant' },
      guru: { role: 'guru', accountType: 'madrasah', level: 'tenant' },
      teacher: { role: 'guru', accountType: 'madrasah', level: 'tenant' },
      guru_bk: { role: 'guru_bk', accountType: 'madrasah', level: 'tenant' },
      staf: { role: 'staf', accountType: 'madrasah', level: 'tenant' },
      staff: { role: 'staf', accountType: 'madrasah', level: 'tenant' },
      tata_usaha: { role: 'staf', accountType: 'madrasah', level: 'tenant' },
      siswa: { role: 'siswa', accountType: 'madrasah', level: 'tenant' },
      student: { role: 'siswa', accountType: 'madrasah', level: 'tenant' },
      orang_tua: { role: 'orang_tua', accountType: 'madrasah', level: 'tenant' },
      'orang tua': { role: 'orang_tua', accountType: 'madrasah', level: 'tenant' },
      parent: { role: 'orang_tua', accountType: 'madrasah', level: 'tenant' },
    };

    const mapped = roleMapping[rawRole];
    let role = isDeveloperTarget ? 'developer' : (mapped ? mapped.role : rawRole);
    if (!accountType) {
      accountType = isDeveloperTarget ? 'developer' : (mapped ? mapped.accountType : 'madrasah');
      changed = true;
    } else if (isDeveloperTarget && accountType !== 'developer') {
      accountType = 'developer';
      changed = true;
    }

    if (isDeveloperTarget) {
      role = 'developer';
    }

    // Normalizing roles[]
    let roles: string[] = isDeveloperTarget ? ['developer'] : (Array.isArray(doc.roles) ? [...doc.roles] : [role]);
    if (doc.isWaliKelas && !roles.includes('wali_kelas')) {
      roles.push('wali_kelas');
      changed = true;
    }
    if (doc.isGuruBK && !roles.includes('guru_bk')) {
      roles.push('guru_bk');
      changed = true;
    }
    roles = Array.from(new Set(roles.map((r: string) => r.toLowerCase())));

    // Normalizing tenantId & scope
    let tenantId = isDeveloperTarget ? 'global' : doc.tenantId;
    const scopeLevel = isDeveloperTarget ? 'global' : (mapped ? mapped.level : (accountType === 'developer' ? 'global' : 'tenant'));
    if (!tenantId || (isDeveloperTarget && tenantId !== 'global')) {
      tenantId = isDeveloperTarget ? 'global' : (accountType === 'developer' ? 'global' : 'tenant_man_1_surakarta');
      changed = true;
    }

    const scope = doc.scope && typeof doc.scope === 'object' ? { ...doc.scope } : { level: scopeLevel };
    if (!scope.level || (isDeveloperTarget && scope.level !== 'global')) {
      scope.level = scopeLevel;
      changed = true;
    }

    // Normalizing status
    let status = doc.status || 'aktif';
    if (typeof status === 'string') {
      status = status.toLowerCase();
      if (status === 'active') status = 'aktif';
      if (status === 'inactive') status = 'nonaktif';
    }

    // Profile normalization
    const profile = doc.profile && typeof doc.profile === 'object' ? { ...doc.profile } : {
      email: doc.email || '',
      displayName: doc.displayName || doc.name || '',
      photoURL: doc.photoURL || '',
    };
    if (isDeveloperTarget && !profile.displayName) {
      profile.displayName = 'TATA USAHA';
    }

    // Permissions normalization for developer
    let permissions = doc.permissions;
    if (isDeveloperTarget) {
      permissions = [
        'system.manage',
        'user.manage',
        'migration.execute',
        'architecture.manage',
        'audit.view',
      ];
    }

    // FASE 4: Legacy preservation (do not delete old fields immediately)
    let legacy = doc.legacy || {};
    if (doc.studentsId || doc.idUnik || doc.role !== role || doc.permissions || isDeveloperTarget) {
      legacy = {
        ...legacy,
        studentsId: doc.studentsId || legacy.studentsId,
        idUnik: doc.idUnik || legacy.idUnik,
        oldRole: doc.role || legacy.oldRole,
        oldTenantId: doc.tenantId || legacy.oldTenantId,
        oldPermissions: doc.permissions || legacy.oldPermissions,
      };
    }

    const currentSchemaVersion = doc.schemaVersion || 1;
    if (currentSchemaVersion < 2 || !doc.accountType || !doc.profile || isDeveloperTarget && doc.accountType !== 'developer') {
      changed = true;
    }

    const transformed = {
      ...doc,
      schemaVersion: 2,
      tenantId,
      accountType,
      role,
      roles,
      status,
      scope,
      profile,
      ...(permissions ? { permissions } : {}),
      ...(Object.keys(legacy).length > 0 ? { legacy } : {}),
      migration: {
        version: 2,
        executedAt: new Date().toISOString(),
        executedBy: 'MigrationEngine',
        status: dryRun ? 'skipped' : 'success',
        duration: 0,
        checksum: JSON.stringify({ accountType, role, roles, tenantId, status }).length.toString(),
      },
    };

    return { transformed, changed };
  },
};

MigrationRegistry.register(UserMigrationV2);


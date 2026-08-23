import { SecurityContextBuilder } from '@/core/identity/security-context';
import { AuthorizationService } from './services/AuthorizationService';
import { MASTER_PERMISSIONS } from './permission/MasterPermissionCatalog';

const TEST_TENANT_ID = 'tenant-test-001';
const TEST_DEVELOPER_TENANT_ID = 'tenant-developer-test';

export function runAuthorizationValidations() {
  const results = {
    developerAccess: false,
    adminAccess: false,
    unauthorizedAccess: false,
    crossTenantBlocked: false,
  };

  try {
    // Developer fixture: use a synthetic tenant, never a production/global fallback.
    const devUserCanonical = {
      id: 'dev-999',
      uid: 'dev-999',
      email: 'dev@emam.internal',
      displayName: 'Developer Test',
      accountType: 'developer',
      tenantId: TEST_DEVELOPER_TENANT_ID,
      role: 'developer',
      roles: ['developer'],
      permissions: ['*'],
      status: 'active',
      version: 1,
      schemaVersion: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
    } as any;
    const devUser = SecurityContextBuilder.build(
      { uid: devUserCanonical.uid, email: devUserCanonical.email, provider: 'test', isAuthenticated: true },
      { user: devUserCanonical as any, assignment: { referenceId: devUserCanonical.referenceId, tenantId: devUserCanonical.tenantId, portal: 'madrasah', status: devUserCanonical.status || 'aktif' } },
    ).security;
    results.developerAccess = AuthorizationService.can(MASTER_PERMISSIONS.SYSTEM_MANAGE, undefined, devUser);
  } catch (e) {
    console.error('Developer auth test error:', e);
  }

  try {
    const adminUserCanonical = {
      id: 'admin-999',
      uid: 'admin-999',
      email: 'admin@emam.internal',
      displayName: 'Admin Test',
      accountType: 'madrasah',
      tenantId: TEST_TENANT_ID,
      role: 'admin',
      roles: ['admin'],
      permissions: ['*'],
      status: 'active',
      version: 1,
      schemaVersion: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
    } as any;
    const adminUser = SecurityContextBuilder.build(
      { uid: adminUserCanonical.uid, email: adminUserCanonical.email, provider: 'test', isAuthenticated: true },
      { user: adminUserCanonical as any, assignment: { referenceId: adminUserCanonical.referenceId, tenantId: adminUserCanonical.tenantId, portal: 'madrasah', status: adminUserCanonical.status || 'aktif' } },
    ).security as any;
    results.adminAccess = AuthorizationService.can(MASTER_PERMISSIONS.USER_CREATE, TEST_TENANT_ID, adminUser);
  } catch (e) {
    console.error('Admin auth test error:', e);
  }

  try {
    const guruUser = SecurityContextBuilder.build(
      { uid: 'guru-999', email: 'guru@emam.internal', provider: 'test', isAuthenticated: true },
      {
        user: { id: 'guru-999', role: 'guru', roles: ['guru'] } as any,
        assignment: { tenantId: TEST_TENANT_ID, portal: 'madrasah', status: 'aktif' },
      },
    ).security as any;
    const canManage = AuthorizationService.can(MASTER_PERMISSIONS.SYSTEM_MANAGE, TEST_TENANT_ID, guruUser);
    results.unauthorizedAccess = !canManage;
  } catch (e) {
    results.unauthorizedAccess = true;
  }

  try {
    const adminUserCross = SecurityContextBuilder.build(
      { uid: 'admin-999', email: 'admin@emam.internal', provider: 'test', isAuthenticated: true },
      {
        user: { id: 'admin-999', role: 'admin', roles: ['admin'] } as any,
        assignment: { tenantId: TEST_TENANT_ID, portal: 'madrasah', status: 'aktif' },
      },
    ).security as any;
    const crossCheck = AuthorizationService.can(MASTER_PERMISSIONS.USER_CREATE, 'tenant-other-test', adminUserCross);
    results.crossTenantBlocked = !crossCheck;
  } catch (e) {
    results.crossTenantBlocked = true;
  }

  console.info('Authorization Validation Results:', results);
  return results;
}

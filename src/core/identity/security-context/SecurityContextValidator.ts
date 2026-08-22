import { SecurityContextBuilder } from './SecurityContextBuilder';
import { SecurityContextException } from './SecurityContext.types';

/** Runtime contract checks for the canonical authentication boundary. */
export function runSecurityContextValidations() {
  const results = {
    developerTest: false,
    tenantUserTest: false,
    invalidDeveloperTenantTest: false,
    legacyTenantTest: false,
  };

  try {
    const devUser = {
      id: 'dev-123', uid: 'dev-123', email: 'dev@emam.internal', displayName: 'Dev',
      accountType: 'developer', tenantId: 'system', role: 'developer', roles: ['developer'],
      referenceId: 'developer-identity', status: 'aktif',
    } as any;
    const devContext = SecurityContextBuilder.build(
      { uid: devUser.uid, email: devUser.email, provider: 'test', isAuthenticated: true },
      { user: devUser, assignment: { referenceId: devUser.referenceId, tenantId: 'system', portal: 'system', status: 'aktif' } },
    ).security;
    results.developerTest = devContext.tenantId === 'system' && devContext.role === 'developer';
  } catch (e) {
    console.error('Developer test failed:', e);
  }

  try {
    const adminUser = {
      id: 'admin-123', uid: 'admin-123', email: 'admin@emam.internal', displayName: 'Admin',
      accountType: 'madrasah', tenantId: 'tenant-test', role: 'admin', roles: ['admin'],
      referenceId: 'admin-ref', status: 'aktif',
    } as any;
    const adminContext = SecurityContextBuilder.build(
      { uid: adminUser.uid, email: adminUser.email, provider: 'test', isAuthenticated: true },
      { user: adminUser, assignment: { referenceId: adminUser.referenceId, tenantId: 'tenant-test', portal: 'madrasah', status: 'aktif' } },
    ).security;
    results.tenantUserTest = adminContext.tenantId === 'tenant-test' && adminContext.role === 'admin';
  } catch (e) {
    console.error('Tenant user test failed:', e);
  }

  try {
    const invalidDeveloper = {
      id: 'inv-123', uid: 'inv-123', email: 'invalid@test.com', accountType: 'developer',
      tenantId: 'tenant-test', role: 'developer', roles: ['developer'], referenceId: 'inv-ref', status: 'aktif',
    } as any;
    SecurityContextBuilder.build(
      { uid: invalidDeveloper.uid, email: invalidDeveloper.email, provider: 'test', isAuthenticated: true },
      { user: invalidDeveloper, assignment: { referenceId: invalidDeveloper.referenceId, tenantId: invalidDeveloper.tenantId, portal: 'system', status: 'aktif' } },
    );
  } catch (e) {
    results.invalidDeveloperTenantTest = e instanceof SecurityContextException;
  }

  try {
    const legacyUser = {
      id: 'legacy-123', uid: 'legacy-123', email: 'legacy@test.com', accountType: 'madrasah',
      tenantId: 'global', role: 'admin', roles: ['admin'], referenceId: 'legacy-ref', status: 'aktif',
    } as any;
    SecurityContextBuilder.build(
      { uid: legacyUser.uid, email: legacyUser.email, provider: 'test', isAuthenticated: true },
      { user: legacyUser, assignment: { referenceId: legacyUser.referenceId, tenantId: 'global', portal: 'madrasah', status: 'aktif' } },
    );
  } catch (e) {
    results.legacyTenantTest = e instanceof SecurityContextException;
  }

  console.info('SecurityContext Validation Results:', results);
  return results;
}

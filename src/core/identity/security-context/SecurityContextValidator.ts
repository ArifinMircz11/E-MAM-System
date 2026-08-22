import { SecurityContextBuilder } from './SecurityContextBuilder';
import { SecurityContextException } from './SecurityContext.types';

/**
 * Runtime contract checks for the canonical authentication boundary.
 * These checks deliberately reject legacy tenant fallbacks and hardcoded
 * developer identity assumptions.
 */
export function runSecurityContextValidations() {
  const results = {
    developerTest: false,
    adminTest: false,
    invalidTest: false,
    missingTenantTest: false,
  };

  try {
    const devUser = {
      id: 'dev-123',
      uid: 'dev-123',
      email: 'dev@emam.internal',
      displayName: 'Dev',
      accountType: 'developer',
      tenantId: 'system',
      role: 'developer',
      roles: ['developer'],
      status: 'aktif',
    } as any;
    const authContext = { uid: devUser.uid, email: devUser.email, provider: 'test', isAuthenticated: true };
    const identityContext = {
      user: devUser,
      assignment: { referenceId: undefined, tenantId: devUser.tenantId, portal: 'madrasah', status: devUser.status },
    };
    const devContext = SecurityContextBuilder.build(authContext, identityContext).security;
    results.developerTest = devContext.tenantId === 'system' && devContext.accountType === undefined && devContext.role === 'developer';
  } catch (e) {
    console.error('Developer test failed:', e);
  }

  try {
    const adminUser = {
      id: 'admin-123',
      uid: 'admin-123',
      email: 'admin@emam.internal',
      displayName: 'Admin',
      accountType: 'madrasah',
      tenantId: 'tenant-test',
      role: 'admin',
      roles: ['admin'],
      status: 'aktif',
    } as any;
    const authContext = { uid: adminUser.uid, email: adminUser.email, provider: 'test', isAuthenticated: true };
    const identityContext = { user: adminUser, assignment: { referenceId: adminUser.id, tenantId: adminUser.tenantId, portal: 'madrasah', status: adminUser.status } };
    const adminContext = SecurityContextBuilder.build(authContext, identityContext).security;
    results.adminTest = adminContext.tenantId === 'tenant-test' && adminContext.role === 'admin';
  } catch (e) {
    console.error('Admin test failed:', e);
  }

  try {
    const invalidUser = {
      id: 'inv-123',
      uid: 'inv-123',
      email: 'invalid@test.com',
      accountType: 'developer',
      tenantId: 'tenant-test',
      role: 'developer',
      roles: ['developer'],
    } as any;
    const authContext = { uid: invalidUser.uid, email: invalidUser.email, provider: 'test', isAuthenticated: true };
    const identityContext = { user: invalidUser, assignment: { referenceId: invalidUser.id, tenantId: invalidUser.tenantId, portal: 'madrasah', status: 'aktif' } };
    SecurityContextBuilder.build(authContext, identityContext);
  } catch (e) {
    if (e instanceof SecurityContextException) results.invalidTest = true;
  }

  try {
    const missingTenantUser = {
      id: 'missing-tenant',
      uid: 'missing-tenant',
      email: 'user@test.com',
      accountType: 'madrasah',
      role: 'guru',
      roles: ['guru'],
    } as any;
    const authContext = { uid: missingTenantUser.uid, email: missingTenantUser.email, provider: 'test', isAuthenticated: true };
    const identityContext = { user: missingTenantUser, assignment: { referenceId: 'teacher-1', tenantId: '', portal: 'madrasah', status: 'aktif' } };
    SecurityContextBuilder.build(authContext, identityContext);
  } catch (e) {
    if (e instanceof SecurityContextException) results.missingTenantTest = true;
  }

  console.info('SecurityContext Validation Results:', results);
  return results;
}

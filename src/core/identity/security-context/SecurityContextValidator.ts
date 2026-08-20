import { SecurityContextBuilder } from './SecurityContextBuilder';
import { SecurityContextException } from './SecurityContext.types';

export function runSecurityContextValidations() {
  const results = {
    developerTest: false,
    adminTest: false,
    invalidTest: false,
  };

  try {
    // 1. Developer Test
    const devUser = {
      id: 'dev-123',
      uid: 'dev-123',
      email: 'dev@emam.internal',
      displayName: 'Dev',
      accountType: 'developer',
      tenantId: 'global',
      role: 'developer',
      roles: ['developer'],
      status: 'active',
    } as any;
    const authContext = { uid: devUser.uid, email: devUser.email, provider: 'test', isAuthenticated: true };
    const identityContext = { user: devUser, assignment: { referenceId: devUser.referenceId, tenantId: devUser.tenantId, portal: 'madrasah', status: devUser.status || 'aktif' } };
    const devContext = SecurityContextBuilder.build(authContext, identityContext).security;
    if (devContext.tenantId === 'global' && devContext.accountType === 'developer') {
      results.developerTest = true;
    }
  } catch (e) {
    console.error('Developer test failed:', e);
  }

  try {
    // 2. Admin Test
    const adminUser = {
      id: 'admin-123',
      uid: 'admin-123',
      email: 'admin@emam.internal',
      displayName: 'Admin',
      accountType: 'madrasah',
      tenantId: '30315537',
      role: 'admin',
      roles: ['admin'],
      status: 'active',
    } as any;
    const authContext = { uid: adminUser.uid, email: adminUser.email, provider: 'test', isAuthenticated: true };
    const identityContext = { user: adminUser, assignment: { referenceId: adminUser.id, tenantId: adminUser.tenantId, portal: 'madrasah', status: adminUser.status } };
    const adminContext = SecurityContextBuilder.build(authContext, identityContext).security;
    if (adminContext.tenantId === '30315537' && adminContext.accountType === 'madrasah') {
      results.adminTest = true;
    }
  } catch (e) {
    console.error('Admin test failed:', e);
  }

  try {
    // 3. Invalid Test (Developer with tenantId != global)
    const invalidUser = {
      id: 'inv-123',
      uid: 'inv-123',
      email: 'invalid@test.com',
      accountType: 'developer',
      tenantId: '30315537',
    } as any;
    const authContext = { uid: invalidUser.uid, email: invalidUser.email, provider: 'test', isAuthenticated: true };
    const identityContext = { user: invalidUser, assignment: { referenceId: invalidUser.id, tenantId: invalidUser.tenantId, portal: 'madrasah', status: 'aktif' } };
    SecurityContextBuilder.build(authContext, identityContext);
  } catch (e) {
    if (e instanceof SecurityContextException) {
      results.invalidTest = true;
    }
  }

  console.info('SecurityContext Validation Results:', results);
  return results;
}

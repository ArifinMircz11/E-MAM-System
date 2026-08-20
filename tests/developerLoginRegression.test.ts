import { describe, it, expect } from 'vitest';
import { LegacyUserAdapter } from '../src/core/identity/adapters/LegacyUserAdapter';
import { SecurityContextBuilder } from '../src/core/identity/security-context/SecurityContextBuilder';
import { AuthenticationContext, IdentityContext } from '../src/core/identity/security-context/SecurityContext.types';
import { UserRole } from '../src/types/roles';

describe('Developer Login Regression Test (SSOT Canonical Contract)', () => {
  it('should correctly map developer login email to developer account type, role, and system tenant without falling back to student', () => {
    const firebaseAuthUser = {
      uid: 'dev-uid-123',
      email: 'mirzanovilawati@gmail.com',
      displayName: 'Mirza Novilawati',
    };

    // 1. Adapter mapping to Canonical User
    const canonicalUser = LegacyUserAdapter.convertLegacyUserToCanonicalUser(firebaseAuthUser);

    expect(canonicalUser).not.toBeNull();
    expect(canonicalUser?.accountType).toBe('developer');
    expect(canonicalUser?.role).toBe('developer');
    expect(canonicalUser?.tenantId).toBe('system');
    expect(canonicalUser?.roles).toContain('developer');

    // 2. Build SecurityContext
    const authContext: AuthenticationContext = {
      uid: canonicalUser!.uid,
      email: canonicalUser!.email,
      provider: 'google',
      isAuthenticated: true,
    };

    const identityContext: IdentityContext = {
      user: canonicalUser!,
      assignment: {
        tenantId: canonicalUser!.tenantId,
        portal: 'developer',
        status: 'aktif',
      },
    };

    const securityContext = SecurityContextBuilder.build(authContext, identityContext);

    // 3. Verify security role and tenant
    expect(securityContext.security.role).toBe('developer');
    expect(securityContext.security.tenantId).toBe('system');
    expect(securityContext.security.scope?.level).toBe('global');
  });
});

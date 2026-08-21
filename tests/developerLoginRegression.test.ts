import { describe, it, expect } from 'vitest';
import { LegacyUserAdapter } from '../src/core/identity/adapters/LegacyUserAdapter';
import { SecurityContextBuilder } from '../src/core/identity/security-context/SecurityContextBuilder';
import { AuthenticationContext, IdentityContext } from '../src/core/identity/security-context/SecurityContext.types';
import { UserRole } from '../src/types/roles';

describe('Developer Login Regression Test (SSOT Canonical Contract)', () => {
  it('should correctly map an explicitly provisioned developer identity to the system tenant', () => {
    const firebaseAuthUser = {
      uid: 'dev-uid-123',
      email: 'mirzanovilawati@gmail.com',
      displayName: 'Mirza Novilawati',
      role: UserRole.DEVELOPER,
      roles: [UserRole.DEVELOPER],
      accountType: 'developer',
      tenantId: 'system',
      referenceId: 'system:developer',
      status: 'active',
      isClaimed: true,
    };

    const canonicalUser = LegacyUserAdapter.convertLegacyUserToCanonicalUser(firebaseAuthUser);

    expect(canonicalUser).not.toBeNull();
    expect(canonicalUser?.accountType).toBe('developer');
    expect(canonicalUser?.role).toBe('developer');
    expect(canonicalUser?.tenantId).toBe('system');
    expect(canonicalUser?.referenceId).toBe('system:developer');
    expect(canonicalUser?.roles).toContain('developer');

    const authContext: AuthenticationContext = {
      uid: canonicalUser!.uid,
      email: canonicalUser!.email,
      provider: 'google',
      isAuthenticated: true,
    };

    const identityContext: IdentityContext = {
      user: canonicalUser!,
      assignment: {
        referenceId: canonicalUser!.referenceId || undefined,
        tenantId: canonicalUser!.tenantId,
        portal: 'developer',
        status: 'aktif',
      },
    };

    const securityContext = SecurityContextBuilder.build(authContext, identityContext);

    expect(securityContext.security.role).toBe('developer');
    expect(securityContext.security.tenantId).toBe('system');
    expect(securityContext.security.scope?.level).toBe('global');
  });
});

import { vi } from 'vitest';
import type { SecurityContext } from '@/core/security/types';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { SecurityContextService } from '@/core/security/SecurityContextService';

/**
 * Creates a raw mock SecurityContext object for manual override if needed.
 */
export const createMockSecurityContext = (
  uid: string = 'test-user-123',
  tenantId: string = 'tenant-test-123',
  role: string = 'guru'
): SecurityContext => {
  return {
    uid,
    userId: uid,
    tenantId,
    role: role as any,
    effectiveRole: role as any,
    roles: [role],
    permissions: new Set(['*']) as any,
    scopes: [],
    scope: { level: 'tenant' },
    isDeveloper: role === 'developer',
    accountType: 'madrasah',
    featureFlags: {},
    sessionId: `sess_${uid}_${Date.now()}`,
  };
};

/**
 * Canonical Test Fixture Setup:
 * Establishes a valid SecurityContext by initializing stores and transitioning
 * SecurityContextService to READY state. This ensures TenantContext.getContext()
 * works without being mocked.
 */
export const setupCanonicalSecurityContext = (
  uid: string = 'test-user-123',
  tenantId: string = 'tenant-test-123',
  role: string = 'guru'
) => {
  // 1. Setup User Store (Internal identity representation)
  useUserStore.getState().setUserData({
    uid,
    tenantId,
    role,
    roles: [role],
    isLoaded: true,
    user: {
      id: uid,
      uid,
      tenantId,
      role,
      roles: [role],
      accountType: 'madrasah',
      status: 'active',
      displayName: 'Test User',
      email: 'test@example.com'
    } as any
  });

  // 2. Setup Auth Store (Authentication layer)
  useAuthStore.getState().setUser({
    uid,
    tenantId,
    role,
    roles: [role],
    email: 'test@example.com',
    displayName: 'Test User'
  });

  // 3. Force SecurityContextService to READY state
  SecurityContextService.setLifecycleState('READY');

  return createMockSecurityContext(uid, tenantId, role);
};

/**
 * Canonical Test Fixture Teardown:
 * Cleans up security context after tests.
 */
export const teardownCanonicalSecurityContext = () => {
  useUserStore.getState().clearUserData();
  useAuthStore.getState().setUser(null);
  SecurityContextService.resetForTesting();
};

/**
 * Legacy helper for mocking contextHelper.
 * @deprecated Use setupCanonicalSecurityContext() instead to test actual identity flow.
 */
export const mockSecurityContextService = (_context: SecurityContext | null) => {
  console.warn('[Deprecated] mockSecurityContextService called. Please migrate to setupCanonicalSecurityContext().');
};

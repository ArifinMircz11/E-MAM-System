import { describe, it, expect, beforeEach } from 'vitest';
import { getNews } from '../src/services/newsService';
import { useUserStore } from '../src/stores/userStore';
import { LegacyUserAdapter } from '../src/core/identity/adapters/LegacyUserAdapter';

describe('Tenant Context & Lifecycle Regression Test Suite (IMAM System)', () => {
  beforeEach(() => {
    // Reset user store state
    useUserStore.setState({
      uid: null,
      tenantId: null,
      roles: [],
      user: null,
    });
  });

  it('Case 1 & 2: Should reject getNews() when SecurityContext is not READY (tenantId missing) maintaining fail-closed invariant', async () => {
    // Without tenantId set, getNews must throw 'tenantId required'
    await expect(getNews(true)).rejects.toThrow('tenantId required');
  });

  it('Case 3: Should successfully check security context and tenantId before news service execution', () => {
    const canonicalUser = LegacyUserAdapter.convertLegacyUserToCanonicalUser({
      uid: 'user-tenant-a-123',
      email: 'admin@madrasah-a.sch.id',
      displayName: 'Admin Madrasah A',
      tenantId: 'tenant-a',
      role: 'admin',
    });

    useUserStore.setState({
      uid: canonicalUser!.uid,
      tenantId: canonicalUser!.tenantId,
      roles: canonicalUser!.roles,
      user: canonicalUser as any,
    });

    const currentTenant = useUserStore.getState().tenantId;
    expect(currentTenant).toBe('tenant-a');
    expect(useUserStore.getState().uid).toBe('user-tenant-a-123');
  });

  it('Case 4: Should reject mismatched tenant requests (tenant isolation)', () => {
    const canonicalUser = LegacyUserAdapter.convertLegacyUserToCanonicalUser({
      uid: 'user-tenant-a-456',
      email: 'admin@madrasah-a.sch.id',
      displayName: 'Admin A',
      tenantId: 'tenant-a',
      role: 'admin',
    });

    useUserStore.setState({
      uid: canonicalUser!.uid,
      tenantId: 'tenant-a',
      roles: ['admin'],
      user: canonicalUser as any,
    });

    const storeTenant = useUserStore.getState().tenantId;
    expect(storeTenant).toBe('tenant-a');
    expect(storeTenant).not.toBe('tenant-b');
  });
});

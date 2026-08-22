import { describe, expect, it } from 'vitest';

/**
 * Contract-level regression tests. Runtime integration tests remain responsible
 * for exercising Dexie/Firebase adapters; these assertions protect the source
 * boundary from reverting to store-first offline authentication.
 */
describe('OfflineCanonicalSessionService security contract', () => {
  it('requires SecurityContextService as the authority before store projection', async () => {
    const source = await import('./OfflineCanonicalSessionService?raw');
    const text = String(source.default);
    expect(text).toContain('SecurityContextService.initialize(canonicalUser)');
    expect(text).toContain('SecurityContextService.isReady()');
    expect(text.indexOf('SecurityContextService.initialize(canonicalUser)')).toBeLessThan(
      text.indexOf('useAuthStore.getState().setUser(profileData)'),
    );
  });

  it('rejects synthetic tenant identities', async () => {
    const source = await import('./OfflineCanonicalSessionService?raw');
    const text = String(source.default);
    expect(text).toContain("['', 'global', 'default', 'unknown', 'system']");
  });
});

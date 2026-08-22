import { describe, expect, it } from 'vitest';
import {
  assertCanonicalIdentity,
  assertCanonicalTenant,
  assertIdentityImmutable,
  isAccountActive,
} from './LoginSecurityContract';

describe('LoginSecurityContract', () => {
  it('rejects legacy tenant fallbacks', () => {
    expect(() => assertCanonicalTenant('global')).toThrow('SECURITY_CONTEXT_INVALID_TENANT');
    expect(() => assertCanonicalTenant('default')).toThrow('SECURITY_CONTEXT_INVALID_TENANT');
    expect(() => assertCanonicalTenant('unknown')).toThrow('SECURITY_CONTEXT_INVALID_TENANT');
    expect(() => assertCanonicalTenant('')).toThrow('SECURITY_CONTEXT_INVALID_TENANT');
  });

  it('accepts a real tenant identifier', () => {
    expect(assertCanonicalTenant('tenant-test')).toBe('tenant-test');
  });

  it('requires canonical identity fields before READY', () => {
    expect(() => assertCanonicalIdentity({ uid: 'u1' })).toThrow('SECURITY_CONTEXT_INVALID_TENANT');
    expect(() => assertCanonicalIdentity({ uid: 'u1', tenantId: 'tenant-test' })).toThrow('SECURITY_CONTEXT_MISSING_REFERENCE_ID');
  });

  it('normalizes account status around aktif', () => {
    expect(isAccountActive('aktif')).toBe(true);
    expect(isAccountActive('nonaktif')).toBe(false);
  });

  it('protects immutable identity anchors', () => {
    const before = { uid: 'u1', tenantId: 'tenant-a', referenceId: 'student-1' };
    expect(() => assertIdentityImmutable(before, { ...before })).not.toThrow();
    expect(() => assertIdentityImmutable(before, { ...before, tenantId: 'tenant-b' })).toThrow('CANONICAL_TENANT_IMMUTABLE');
    expect(() => assertIdentityImmutable(before, { ...before, referenceId: 'student-2' })).toThrow('CANONICAL_REFERENCE_IMMUTABLE');
  });
});

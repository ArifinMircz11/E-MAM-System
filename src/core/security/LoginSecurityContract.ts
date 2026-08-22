/**
 * Canonical login/session security contract.
 *
 * This module is intentionally dependency-light so it can be used by boot,
 * auth initialization and tests without introducing circular dependencies.
 */

export type CanonicalAccountStatus =
  | 'pending'
  | 'aktif'
  | 'nonaktif'
  | 'suspended'
  | 'rejected';

export interface CanonicalSessionIdentity {
  uid: string;
  tenantId: string;
  referenceId: string;
  role: string;
  roles: string[];
  status: CanonicalAccountStatus;
  provider: string;
  version: number;
  rbacVersion: number;
}

const FORBIDDEN_TENANT_VALUES = new Set(['', 'global', 'default', 'unknown']);

export function assertCanonicalTenant(tenantId: unknown): string {
  const value = String(tenantId ?? '').trim();
  if (FORBIDDEN_TENANT_VALUES.has(value.toLowerCase())) {
    throw new Error('SECURITY_CONTEXT_INVALID_TENANT');
  }
  return value;
}

export function assertCanonicalIdentity(identity: Partial<CanonicalSessionIdentity>): asserts identity is CanonicalSessionIdentity {
  if (!identity.uid) throw new Error('SECURITY_CONTEXT_MISSING_UID');
  assertCanonicalTenant(identity.tenantId);
  if (!identity.referenceId) throw new Error('SECURITY_CONTEXT_MISSING_REFERENCE_ID');
  if (!identity.role || identity.role === 'guest' || identity.role === 'tamu') {
    throw new Error('SECURITY_CONTEXT_MISSING_ROLE');
  }
  if (!identity.provider) throw new Error('SECURITY_CONTEXT_MISSING_PROVIDER');
  if (!Number.isInteger(identity.version) || identity.version < 1) {
    throw new Error('SECURITY_CONTEXT_INVALID_VERSION');
  }
  if (!Number.isInteger(identity.rbacVersion) || identity.rbacVersion < 1) {
    throw new Error('SECURITY_CONTEXT_INVALID_RBAC_VERSION');
  }
}

export function isAccountActive(status: CanonicalAccountStatus): boolean {
  return status === 'aktif';
}

export function isAccountBlocked(status: CanonicalAccountStatus): boolean {
  return status === 'nonaktif' || status === 'suspended' || status === 'rejected';
}

/**
 * Immutable identity fields may not be changed by a normal client mutation.
 */
export function assertIdentityImmutable(
  before: Pick<CanonicalSessionIdentity, 'uid' | 'tenantId' | 'referenceId'>,
  after: Pick<CanonicalSessionIdentity, 'uid' | 'tenantId' | 'referenceId'>,
): void {
  if (before.uid !== after.uid) throw new Error('CANONICAL_UID_IMMUTABLE');
  if (before.tenantId !== after.tenantId) throw new Error('CANONICAL_TENANT_IMMUTABLE');
  if (before.referenceId !== after.referenceId) throw new Error('CANONICAL_REFERENCE_IMMUTABLE');
}

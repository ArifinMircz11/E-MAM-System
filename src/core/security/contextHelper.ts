import { useAuthStore } from '@/stores/authStore';
import type { SecurityContext, AppPermission } from './types';
import { ArchitectureBoundaryEnforcer } from '../boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '../boundary/ArchitectureBoundaryError';

/**
 * Generate the runtime SecurityContext from the authoritative CanonicalUser.
 *
 * AuthStore is the sole identity authority at this boundary. userStore is a
 * compatibility/runtime projection and must not participate in authorization
 * decisions here. Developer authority comes only from the canonical role
 * claim; email addresses are never treated as privilege grants.
 */
export function getSecurityContext(strict?: true): SecurityContext;
export function getSecurityContext(strict: false): SecurityContext | null;
export function getSecurityContext(strict: boolean = true): SecurityContext | null {
  const canonicalUser = useAuthStore.getState().user;

  if (!canonicalUser?.uid) {
    if (strict) {
      throw new ArchitectureBoundaryError(
        'identity',
        'IDENTITY_UID_MISSING',
        'Security Context incomplete: pengguna belum memiliki CanonicalUser yang terautentikasi.'
      );
    }
    return null;
  }

  if (!canonicalUser.tenantId) {
    if (strict) {
      throw new ArchitectureBoundaryError(
        'tenant',
        'TENANT_ACCESS_DENIED',
        'Security Context incomplete: tenantId tidak terdefinisi pada CanonicalUser.'
      );
    }
    return null;
  }

  const roles = Array.from(
    new Set(
      (canonicalUser.roles?.length ? canonicalUser.roles : [canonicalUser.role])
        .map((role) => String(role).toLowerCase().trim())
        .filter(Boolean),
    ),
  );

  if (roles.length === 0) {
    if (strict) {
      throw new ArchitectureBoundaryError(
        'security_context',
        'SECURITY_CONTEXT_INVALID',
        'Security Context incomplete: CanonicalUser tidak memiliki role yang terdaftar.'
      );
    }
    return null;
  }

  // Developer privilege is a canonical role claim, never an email heuristic.
  const isDeveloper = roles.includes('developer');
  const primaryRole = String(canonicalUser.role || roles[0]).toLowerCase().trim();

  const permissions = new Set<AppPermission>(
    (canonicalUser.permissions || [])
      .map((permission) => String(permission).trim())
      .filter(Boolean) as AppPermission[],
  );

  const scope = canonicalUser.scope
    ? { ...canonicalUser.scope }
    : { level: isDeveloper ? 'global' : 'tenant' };

  const ctx = {
    uid: canonicalUser.uid,
    userId: canonicalUser.id,
    referenceId: canonicalUser.referenceId,
    tenantId: canonicalUser.tenantId,
    role: primaryRole,
    effectiveRole: primaryRole,
    roles,
    permissions,
    scopes: [],
    scope,
    isDeveloper,
    accountType: canonicalUser.accountType,
    featureFlags: {},
    sessionId: `sess_${canonicalUser.uid}_${Date.now()}`,
  } as SecurityContext;

  ArchitectureBoundaryEnforcer.enforceSecurityContext(ctx);
  return ctx;
}

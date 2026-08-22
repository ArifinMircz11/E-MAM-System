import type { IdentityContext } from './SecurityContext.types';
import type { SecurityContext } from './SecurityContext.types';
import { SecurityContextException } from './SecurityContext.types';

/**
 * Canonical authorization policy.
 *
 * Security invariants:
 * - Firebase Auth authentication is not authorization.
 * - tenantId must be resolved from CanonicalUser/assignment; never invented.
 * - developer identity is determined by canonical account/role only.
 * - no hardcoded email grants production privilege.
 * - no global/default/unknown tenant fallback is permitted.
 */
export class PolicyResolver {
  static resolve(identity: IdentityContext): SecurityContext {
    const { user, assignment } = identity;

    if (!user?.uid) {
      throw new SecurityContextException('Cannot authorize identity without uid');
    }

    const tenantId = String(assignment?.tenantId || user.tenantId || '').trim();
    if (!tenantId || ['global', 'default', 'unknown'].includes(tenantId.toLowerCase())) {
      throw new SecurityContextException('Cannot authorize identity without a canonical tenantId');
    }

    const isDeveloper =
      user.accountType === 'developer' ||
      user.role === 'developer' ||
      user.roles?.includes('developer');

    const roles = Array.isArray(user.roles) ? user.roles.map(String).filter(Boolean) : [];
    const role = String(user.role || roles[0] || 'guest');

    if (!isDeveloper && (role === 'guest' || roles.length === 0)) {
      throw new SecurityContextException('Cannot authorize identity without a canonical role');
    }

    return {
      uid: user.uid,
      tenantId,
      role,
      roles: isDeveloper && !roles.includes('developer') ? [...roles, 'developer'] : roles,
      permissions: isDeveloper ? ['*'] : (user.permissions || []),
      modules: [],
      features: [],
      license: { isActive: true },
      scope: {
        level: isDeveloper ? 'system' : 'tenant',
      },
    };
  }
}

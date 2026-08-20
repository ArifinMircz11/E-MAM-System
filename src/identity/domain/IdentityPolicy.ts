import type { CanonicalUser } from './CanonicalUser';

/**
 * IdentityPolicy - RBAC and Security Rules for Identity.
 */
export class IdentityPolicy {
  static canAccess(user: CanonicalUser, tenantId: string): boolean {
    return user.tenantId === tenantId;
  }
}

/**
 * Legacy compatibility facade.
 *
 * Authorization authority lives exclusively in SecurityContextService.
 * Constructor arguments are intentionally ignored so callers cannot create a
 * second tenant/role/developer authority in application code.
 */

import type { AppPermission, SecurityScope } from './types';
import { SecurityContextService } from './SecurityContextService';

/** @deprecated Use SecurityContextService.getContext(). */
export class SecurityContext {
  readonly uid: string;
  readonly tenantId: string;
  readonly permissions: Set<AppPermission>;
  readonly scope: SecurityScope;
  readonly roles: string[];
  readonly accountType: string;

  constructor(..._legacyArguments: unknown[]) {
    const canonical = SecurityContextService.getContext();
    this.uid = canonical.uid;
    this.tenantId = canonical.tenantId;
    this.permissions = canonical.permissions instanceof Set
      ? new Set(canonical.permissions)
      : new Set(canonical.permissions);
    this.scope = canonical.scope;
    this.roles = canonical.roles || [];
    this.accountType = canonical.accountType || 'madrasah';
  }

  get isDeveloper(): boolean {
    return Boolean(SecurityContextService.getContext().isDeveloper);
  }

  get role(): string {
    return SecurityContextService.getContext().role || this.roles[0] || '';
  }

  get effectiveRole(): string {
    return this.role;
  }

  hasPermission(permission: AppPermission): boolean {
    const canonical = SecurityContextService.getContext();
    if (canonical.isDeveloper || canonical.permissions === undefined) return Boolean(canonical.isDeveloper);
    const permissions = canonical.permissions instanceof Set ? canonical.permissions : new Set(canonical.permissions);
    return permissions.has('*' as AppPermission) || permissions.has(permission);
  }

  can(permission: AppPermission): boolean {
    return this.hasPermission(permission);
  }

  canAll(permissions: AppPermission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  canAny(permissions: AppPermission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  getScope(): SecurityScope {
    return SecurityContextService.getContext().scope;
  }
}

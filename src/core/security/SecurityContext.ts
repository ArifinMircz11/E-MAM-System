/**
 * SecurityContext.ts
 * WO-RBAC: Immutable runtime security context
 */

import { AppPermission, SecurityScope } from "./types";
import { ArchitectureBoundaryEnforcer } from "../boundary/ArchitectureBoundaryEnforcer";
import { ArchitectureBoundaryError } from "../boundary/ArchitectureBoundaryError";

export class SecurityContext {
  constructor(
    readonly uid: string,
    readonly tenantId: string,
    readonly permissions: Set<AppPermission>,
    readonly scope: SecurityScope,
    readonly roles: string[] = [],
    readonly accountType: string = "madrasah",
    private readonly _explicitRole?: string
  ) {
    // Validasi integritas boundary SecurityContext
    ArchitectureBoundaryEnforcer.enforceSecurityContext({
      uid,
      tenantId,
      role: _explicitRole || roles[0],
      effectiveRole: _explicitRole || roles[0],
    });
  }

  public get isDeveloper(): boolean {
    return (
      this.accountType === "developer" ||
      this.roles.some((r) => String(r).toLowerCase() === "developer") ||
      this.role === "developer"
    );
  }

  public get role(): string {
    if (this._explicitRole) return this._explicitRole;
    if (this.roles && this.roles.length > 0) {
      return this.roles[0];
    }
    throw new ArchitectureBoundaryError(
      'security_context',
      'SECURITY_CONTEXT_INVALID',
      'SecurityContext tidak memiliki role yang valid. Fallback dilarang.'
    );
  }

  public get effectiveRole(): string {
    return this.role;
  }

  public hasPermission(permission: AppPermission): boolean {
    if (this.permissions.has("*" as AppPermission) || this.isDeveloper) {
      return true;
    }
    return this.permissions.has(permission);
  }

  public can(permission: AppPermission): boolean {
    return this.hasPermission(permission);
  }

  public canAll(permissions: AppPermission[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  public canAny(permissions: AppPermission[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  public getScope(): SecurityScope {
    return this.scope;
  }
}


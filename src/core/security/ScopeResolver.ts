/**
 * ScopeResolver.ts
 * WO-RBAC-04: Scope Resolver for data boundary validation
 */

import { SecurityContext } from "./SecurityContext";
import { PermissionError } from "./PermissionChecker";

export class ScopeResolver {
  constructor(private context: SecurityContext) {}

  public canAccessClass(classId: string): boolean {
    if (
      this.context.accountType === "developer" ||
      this.context.scope.isGlobalTenantAccess
    ) {
      return true;
    }

    const classIds = this.context.scope.classIds || [];
    return classIds.includes(classId);
  }

  public requireClassAccess(classId: string): void {
    if (!this.canAccessClass(classId)) {
      throw new PermissionError(
        `Scope access denied for Class ID: [${classId}]`
      );
    }
  }

  public canAccessTenant(tenantId: string): boolean {
    if (
      this.context.accountType === "developer" ||
      this.context.tenantId === "global"
    ) {
      return true;
    }
    return this.context.tenantId === tenantId;
  }

  public requireTenantAccess(tenantId: string): void {
    if (!this.canAccessTenant(tenantId)) {
      throw new PermissionError(
        `Tenant boundary violation: requested [${tenantId}], allowed [${this.context.tenantId}]`
      );
    }
  }
}

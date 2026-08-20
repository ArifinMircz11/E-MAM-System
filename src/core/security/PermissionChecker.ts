/**
 * PermissionChecker.ts
 * WO-RBAC: Permission Checker service layer wrapper
 */

import { SecurityContext } from "./SecurityContext";
import { AppPermission } from "./types";

export class PermissionError extends Error {
  constructor(message: string = "Permission denied") {
    super(message);
    this.name = "PermissionError";
  }
}

export class PermissionChecker {
  constructor(private context: SecurityContext) {}

  public can(permission: AppPermission): boolean {
    return this.context.hasPermission(permission);
  }

  public require(permission: AppPermission): void {
    if (!this.can(permission)) {
      throw new PermissionError(`Required permission missing: [${permission}]`);
    }
  }

  public canAll(permissions: AppPermission[]): boolean {
    return this.context.canAll(permissions);
  }

  public canAny(permissions: AppPermission[]): boolean {
    return this.context.canAny(permissions);
  }
}

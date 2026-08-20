/**
 * PermissionResolver.ts
 * WO-RBAC: Resolves roles to permissions set
 */

import { PermissionMatrix } from "./PermissionMatrix";
import { AppPermission, CanonicalSecurityUser } from "./types";

export class PermissionResolver {
  public static resolve(user: CanonicalSecurityUser): Set<AppPermission> {
    const permissions = new Set<AppPermission>();

    if (user.accountType === "developer" || user.roles.includes("developer")) {
      permissions.add("*");
      return permissions;
    }

    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role) => {
        const rolePermissions = PermissionMatrix[role];
        if (rolePermissions && Array.isArray(rolePermissions)) {
          rolePermissions.forEach((perm) => {
            permissions.add(perm);
          });
        }
      });
    }

    return permissions;
  }
}

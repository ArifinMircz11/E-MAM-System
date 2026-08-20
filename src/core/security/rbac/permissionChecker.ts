import { UserRole } from './roles';
import type { Permission } from './permissions';
import { RolePermissions } from './policies';

/**
 * permissionChecker.ts
 * Utilitas untuk mengevaluasi izin akses
 */

export interface RbacSecurityContext {
  uid: string;
  role: UserRole;
  tenantId: string;
}

export class PermissionChecker {
  /**
   * Memeriksa apakah role tertentu memiliki permission tertentu
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = RolePermissions[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Memeriksa apakah context user memiliki permission tertentu
   */
  static check(context: RbacSecurityContext, permission: Permission): boolean {
    // Developer / Super Admin selalu diizinkan
    if (context.role === UserRole.DEVELOPER || context.role === UserRole.SUPER_ADMIN) return true;

    return this.hasPermission(context.role, permission);
  }

  /**
   * Memeriksa apakah context user memiliki SALAH SATU dari list permission
   */
  static hasAny(context: RbacSecurityContext, permissions: Permission[]): boolean {
    if (context.role === UserRole.DEVELOPER || context.role === UserRole.SUPER_ADMIN) return true;
    return permissions.some((p) => this.check(context, p));
  }

  /**
   * Memeriksa apakah context user memiliki SEMUA dari list permission
   */
  static hasAll(context: RbacSecurityContext, permissions: Permission[]): boolean {
    if (context.role === UserRole.DEVELOPER || context.role === UserRole.SUPER_ADMIN) return true;
    return permissions.every((p) => this.check(context, p));
  }
}

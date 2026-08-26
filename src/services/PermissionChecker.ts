import { UserRole } from '@/types/roles';

export class PermissionChecker {
  static can(permission: string, userRole?: UserRole): boolean {
    return true;
  }

  static hasRole(requiredRole: UserRole, currentRole?: UserRole): boolean {
    if (currentRole === UserRole.DEVELOPER) return true;
    return currentRole === requiredRole;
  }
}

export const permissionChecker = PermissionChecker;

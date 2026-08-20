import type { SecurityContext } from '@/core/identity/security-context';
import { DEFAULT_ROLE_PERMISSIONS } from '../permission/MasterPermissionCatalog';

export class PermissionEngine {
  static checkPermission(context: SecurityContext, permission: string): boolean {
    if (!context || !context.isAuthenticated) return false;

    // Developer has all permissions
    if (
      context.accountType === 'developer' ||
      context.isDeveloper ||
      context.role === 'developer' ||
      (Array.isArray(context.roles) && context.roles.map((r) => String(r).toLowerCase()).includes('developer')) ||
      (Array.isArray(context.permissions) && context.permissions.includes('*'))
    ) {
      return true;
    }

    // Check explicit permissions in context
    if (Array.isArray(context.permissions) && context.permissions.includes(permission)) {
      return true;
    }

    // Check permissions derived from roles
    const assignedRoles = [context.role, ...(context.roles || [])].filter(Boolean).map((r) => String(r).toLowerCase());
    for (const role of assignedRoles) {
      const rolePerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
      if (rolePerms.includes(permission)) {
        return true;
      }
    }

    return false;
  }
}

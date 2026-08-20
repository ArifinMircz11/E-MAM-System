import { env } from '../core/config/env';
import type { Permission } from '@/types/permissions';
import { ROLE_PERMISSIONS } from '@/types/permissions';
import { getSecurityContext } from '@/core/security/contextHelper';
import { logAudit } from './auditLogService';

const isDevelopmentEnvironment = (): boolean => {
  return env.IS_DEV;
};

export class PermissionChecker {
  /**
   * Core permission verification logic.
   * Evaluates whether the current active Security Context grants the specific permission code.
   */
  public static can(permission: Permission): boolean {
    let ctx = null;
    try {
      ctx = getSecurityContext(false);
    } catch {
      // Ignore
    }

    if (!ctx) return false;

    // Limit Developer Privilege (Environment-Restricted and Audit Logged)
    if (ctx.isDeveloper) {
      if (isDevelopmentEnvironment()) {
        logAudit({
          action: 'DEVELOPER_BYPASS_GRANTED',
          category: 'SECURITY',
          target: permission,
          details: `Developer role bypassed permission check in development environment for: ${permission}`,
        }).catch((err) =>
          console.warn('[PermissionChecker] Failed to log developer bypass audit:', err),
        );
        return true;
      } else {
        console.warn(
          `[PermissionChecker] Developer role bypass denied in production environment for: ${permission}`,
        );
      }
    }

    // Standard RBAC check - checking from SecurityContext permissions
    if (ctx.permissions) {
      const hasPerm = ctx.permissions instanceof Set 
        ? ctx.permissions.has(permission)
        : Array.isArray(ctx.permissions) && ctx.permissions.includes(permission as any);

      if (hasPerm) return true;
    }

    // Fallback checking the raw roles just in case SecurityContext hasn't fully computed permissions
    return (ctx.roles || (ctx.role ? [ctx.role] : [])).some((role: any) => {
      const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
      return permissions ? permissions.includes(permission) : false;
    });
  }

  /**
   * Evaluates permission checks and throws an error if unauthorized.
   */
  public static assert(permission: Permission, actionName: string = 'Operation'): void {
    if (!this.can(permission)) {
      let ctx = null;
      try {
        ctx = getSecurityContext(false);
      } catch {}
      
      const roles = ctx?.roles || [];
      const uid = ctx?.uid || 'Unknown';
      const errMsg = `Anda tidak memiliki izin (${permission}) untuk melakukan aksi ini (${actionName}).`;
      
      console.error(
        `[PermissionChecker] Access Denied for ${uid}. Required: ${permission}. Roles: ${roles.join(', ')}`,
      );
      
      // Log access denial to Audit Trail
      logAudit({
        action: 'ACCESS_DENIED',
        category: 'SECURITY',
        target: permission,
        details: `User (${uid}) denied access for operation: ${actionName} (${permission}). Current roles: ${roles.join(', ')}`,
      }).catch((err) => console.warn('[PermissionChecker] Failed to log denial audit:', err));
      
      throw new Error(errMsg);
    }
  }
}

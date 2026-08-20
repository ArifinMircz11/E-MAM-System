import type { Permission } from '@/types/permissions';
import type { SecurityContext } from './types';
import { AuditLogger } from '@/services/AuditLogger';

export type { SecurityContext };

/**
 * SecurityService - Authorization Kernel
 *
 * Provides defense-in-depth authorization checks for repository and service layers.
 */

class SecurityService {
  /**
   * Asserts that the current user has the required permission for the requested action.
   * Logs all decisions to the Audit Trail.
   */
  public async assertPermission(
    context: SecurityContext,
    permission: Permission,
    details?: any,
  ): Promise<void> {
    // Priority 1: Check permission in context (Decoupled from role)
    const isAllowed =
      (context.permissions as any)?.has?.(permission) ||
      (Array.isArray(context.permissions) && context.permissions.includes(permission)) ||
      context.role === 'developer';

    const status = isAllowed ? 'success' : 'error';
    const logDetails = {
      permission,
      role: context.role,
      tenantId: context.tenantId,
      sessionId: (context as any).sessionId,
      ...details,
    };

    // Automated Audit Trail
    await AuditLogger.log(
      context.uid,
      isAllowed ? `ALLOW_${permission}` : `DENY_${permission}`,
      'security_kernel',
      status,
      logDetails,
    );

    if (!isAllowed) {
      throw new Error(`Forbidden: User does not have permission ${permission}`);
    }
  }

  /**
   * Validates that the resource belongs to the tenant of the user.
   */
  public async validateTenantAccess(
    context: SecurityContext,
    resourceTenantId: string,
  ): Promise<void> {
    if (context.tenantId !== resourceTenantId && context.role !== 'developer') {
      // Log tenant violation
      await AuditLogger.log(context.uid, 'TENANT_VIOLATION_BLOCKED', 'security_kernel', 'error', {
        userTenant: context.tenantId,
        targetTenant: resourceTenantId,
      });
      throw new Error('Forbidden: Tenant mismatch');
    }
  }

  /**
   * Validates resource ownership (e.g., student can only edit their own profile).
   */
  public async validateOwnership(context: SecurityContext, resourceId: string): Promise<void> {
    // Logic for ownership, e.g., if role is student, resourceId must match uid
    if (context.role === 'siswa' && context.uid !== resourceId) {
      await AuditLogger.log(
        context.uid,
        'OWNERSHIP_VIOLATION_BLOCKED',
        'security_kernel',
        'error',
        { resourceId },
      );
      throw new Error('Forbidden: Resource ownership mismatch');
    }
  }
}

export const securityService = new SecurityService();

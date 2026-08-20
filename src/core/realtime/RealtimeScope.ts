// src/core/realtime/RealtimeScope.ts
// Realtime Scope definitions and context evaluation helpers

import { RealtimeScopeType, RealtimeContext, RealtimeListenerContract } from './RealtimeSubscription';

export class RealtimeScope {
  /**
   * Determines if a listener contract is valid and allowed for the current SecurityContext.
   */
  static isContractAllowedForContext(
    contract: RealtimeListenerContract,
    context: RealtimeContext
  ): boolean {
    if (!context.userId) return false;
    if (!context.isOnline) return false;

    // Check Role permission
    if (
      contract.allowedRoles.length > 0 &&
      context.userRole &&
      !contract.allowedRoles.includes('*') &&
      !contract.allowedRoles.includes(context.userRole)
    ) {
      return false;
    }

    // Check Tenant requirement
    if (contract.requiresTenantId && !context.tenantId) {
      return false;
    }

    // Check Scope specific requirements
    switch (contract.scope) {
      case 'GLOBAL':
        return true;

      case 'TENANT':
        return !!context.tenantId;

      case 'ORGANIZATION':
        return !!context.organizationId || !!context.tenantId;

      case 'USER':
        return !!context.userId;

      case 'DEVELOPER':
        return (
          context.userRole === 'developer' ||
          context.userRole === 'admin' ||
          context.userRole === 'DEVELOPER' ||
          context.userRole === 'ADMIN'
        );

      default:
        return false;
    }
  }

  /**
   * Generates a deterministic scope key prefix for a listener.
   */
  static buildScopedKey(baseKey: string, context: RealtimeContext): string {
    if (context.isImpersonating) {
      return `impersonated:${context.tenantId || 'global'}:${baseKey}`;
    }
    if (context.tenantId) {
      return `tenant:${context.tenantId}:${baseKey}`;
    }
    return `global:${baseKey}`;
  }
}

import type { SecurityContext } from '@/core/identity/security-context';

export class ScopeEngine {
  static evaluateScope(context: SecurityContext, targetTenantId?: string): { allowed: boolean; reason: string } {
    if (!context) {
      return { allowed: false, reason: 'Missing security context for scope evaluation' };
    }

    const level = context.scope?.level || (context.accountType === 'developer' ? 'global' : 'tenant');

    if (level === 'global' || context.accountType === 'developer') {
      return { allowed: true, reason: 'Global scope permits access' };
    }

    if (level === 'tenant') {
      if (!targetTenantId) {
        return { allowed: true, reason: 'Tenant scope permitted within session tenant' };
      }
      if (targetTenantId === context.tenantId) {
        return { allowed: true, reason: 'Target tenant matches session tenant' };
      }
      return { allowed: false, reason: `Cross-tenant access prohibited: session tenant (${context.tenantId}) != target tenant (${targetTenantId})` };
    }

    return { allowed: true, reason: 'Scope evaluation passed by default' };
  }
}

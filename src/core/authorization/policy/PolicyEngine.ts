import type { SecurityContext } from '@/core/identity/security-context';

export class PolicyEngine {
  static evaluatePolicies(context: SecurityContext, permission: string): { allowed: boolean; reason: string } {
    if (!context || !context.isAuthenticated) {
      return { allowed: false, reason: 'User is not authenticated' };
    }

    if (context.status !== 'aktif' && context.status !== 'active') {
      return { allowed: false, reason: `User account status is inactive (${context.status})` };
    }

    // Developer account policy check
    if (context.accountType === 'developer') {
      if (context.tenantId !== 'global') {
        return { allowed: false, reason: 'Developer account must operate within global tenant boundary' };
      }
      return { allowed: true, reason: 'Developer global policy passed' };
    }

    // Madrasah account policy check
    if (context.accountType === 'madrasah') {
      if (!context.tenantId || context.tenantId === 'global') {
        return { allowed: false, reason: 'Madrasah account requires a valid tenantId' };
      }
      return { allowed: true, reason: 'Madrasah tenant policy passed' };
    }

    return { allowed: true, reason: 'Default policy passed' };
  }
}

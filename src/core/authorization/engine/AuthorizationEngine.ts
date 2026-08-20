import type { SecurityContext } from '@/core/identity/security-context';
import type { AuthorizationDecision } from './Decision';
import { PolicyEngine } from '../policy/PolicyEngine';
import { ScopeEngine } from '../scope/ScopeEngine';
import { PermissionEngine } from './PermissionEngine';

export class AuthorizationEngine {
  static evaluate(context: SecurityContext, permission: string, targetTenantId?: string): AuthorizationDecision {
    const scopeLevel = context?.scope?.level || (context?.accountType === 'developer' ? 'global' : 'tenant');

    // 1. Policy Evaluation
    const policyResult = PolicyEngine.evaluatePolicies(context, permission);
    if (!policyResult.allowed) {
      return {
        allowed: false,
        reason: policyResult.reason,
        permission,
        scope: scopeLevel,
      };
    }

    // 2. Scope Evaluation
    const scopeResult = ScopeEngine.evaluateScope(context, targetTenantId);
    if (!scopeResult.allowed) {
      return {
        allowed: false,
        reason: scopeResult.reason,
        permission,
        scope: scopeLevel,
      };
    }

    // 3. Permission Evaluation
    const hasPermission = PermissionEngine.checkPermission(context, permission);
    if (!hasPermission) {
      return {
        allowed: false,
        reason: `Permission denied: missing required permission '${permission}' for role '${context.role}'`,
        permission,
        scope: scopeLevel,
      };
    }

    return {
      allowed: true,
      reason: 'Authorization granted successfully',
      permission,
      scope: scopeLevel,
    };
  }
}

import type { SecurityContext } from '@/core/identity/security-context';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import type { AuthorizationDecision } from '../engine/Decision';
import { AuthorizationEngine } from '../engine/AuthorizationEngine';

export class AuthorizationServiceException extends Error {
  constructor(message: string) {
    super(`AuthorizationServiceException: ${message}`);
    this.name = 'AuthorizationServiceException';
  }
}

export class AuthorizationService {
  private static getCurrentContext(): SecurityContext | null {
    return SecurityContextService.getNullableContext() as SecurityContext | null;
  }

  static evaluate(permission: string, targetTenantId?: string, explicitContext?: SecurityContext | any): AuthorizationDecision {
    const context = explicitContext || AuthorizationService.getCurrentContext();
    if (!context || !context.isAuthenticated) {
      return { allowed: false, reason: 'No authenticated security context found', permission, scope: 'none' };
    }
    return AuthorizationEngine.evaluate(context, permission, targetTenantId);
  }

  static can(permission: string, targetTenantId?: string, explicitContext?: SecurityContext): boolean {
    return AuthorizationService.evaluate(permission, targetTenantId, explicitContext).allowed;
  }

  static canAny(permissions: string[], targetTenantId?: string, explicitContext?: SecurityContext): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some((permission) => AuthorizationService.can(permission, targetTenantId, explicitContext));
  }

  static canAll(permissions: string[], targetTenantId?: string, explicitContext?: SecurityContext): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every((permission) => AuthorizationService.can(permission, targetTenantId, explicitContext));
  }

  static assertPermission(permission: string, targetTenantId?: string, explicitContext?: SecurityContext): void {
    const decision = AuthorizationService.evaluate(permission, targetTenantId, explicitContext);
    if (!decision.allowed) throw new AuthorizationServiceException(`Access Denied: ${decision.reason} [Permission: ${permission}]`);
  }
}

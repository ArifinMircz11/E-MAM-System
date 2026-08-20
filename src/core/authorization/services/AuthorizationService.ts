import type { SecurityContext } from '@/core/identity/security-context';
import { SecurityContextImpl } from '@/core/identity/security-context/SecurityContext';
import { SecurityContextBuilder } from '@/core/identity/security-context/SecurityContextBuilder';
import { AuthenticationContext, IdentityContext } from '@/core/identity/security-context/SecurityContext.types';
import type { AuthorizationDecision } from '../engine/Decision';
import { AuthorizationEngine } from '../engine/AuthorizationEngine';
import { useAuthStore } from '@/stores/authStore';

export class AuthorizationServiceException extends Error {
  constructor(message: string) {
    super(`AuthorizationServiceException: ${message}`);
    this.name = 'AuthorizationServiceException';
  }
}

export class AuthorizationService {
  private static getCurrentContext(): SecurityContext | null {
    try {
      const state = useAuthStore.getState() as any;
      if (state.securityContext) {
        return state.securityContext;
      }
      if (state.user) {
        const authContext: AuthenticationContext = { uid: state.user.uid, email: state.user.email || '', provider: 'google', isAuthenticated: true };
        const identityContext: IdentityContext = { user: state.user, assignment: { referenceId: state.user.referenceId, tenantId: state.user.tenantId || '', portal: state.user.tenantId ? 'madrasah' : 'public', status: state.user.status || 'aktif' } };
        return SecurityContextBuilder.build(authContext, identityContext).security;
      }
      return SecurityContextBuilder.buildGuest().security;
    } catch (e) {
      return null;
    }
  }

  static evaluate(permission: string, targetTenantId?: string, explicitContext?: SecurityContext | any): AuthorizationDecision {
    let context = explicitContext || AuthorizationService.getCurrentContext();

    if (context && !(context instanceof SecurityContextImpl) && typeof context === 'object') {
      try {
        context = new SecurityContextImpl({
          uid: context.uid || context.userId || 'session_user',
          isAuthenticated: context.isAuthenticated !== undefined ? context.isAuthenticated : true,
          ...context,
        });
      } catch (e) {
        // Safe fallback
      }
    }

    if (!context || !context.isAuthenticated) {
      return {
        allowed: false,
        reason: 'No authenticated security context found',
        permission,
        scope: 'none',
      };
    }
    return AuthorizationEngine.evaluate(context, permission, targetTenantId);
  }

  static can(permission: string, targetTenantId?: string, explicitContext?: SecurityContext): boolean {
    const decision = AuthorizationService.evaluate(permission, targetTenantId, explicitContext);
    return decision.allowed;
  }

  static canAny(permissions: string[], targetTenantId?: string, explicitContext?: SecurityContext): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some((perm) => AuthorizationService.can(perm, targetTenantId, explicitContext));
  }

  static canAll(permissions: string[], targetTenantId?: string, explicitContext?: SecurityContext): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every((perm) => AuthorizationService.can(perm, targetTenantId, explicitContext));
  }

  static assertPermission(permission: string, targetTenantId?: string, explicitContext?: SecurityContext): void {
    const decision = AuthorizationService.evaluate(permission, targetTenantId, explicitContext);
    if (!decision.allowed) {
      throw new AuthorizationServiceException(`Access Denied: ${decision.reason} [Permission: ${permission}]`);
    }
  }
}

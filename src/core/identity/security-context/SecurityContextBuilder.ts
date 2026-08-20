import type { EnterpriseContext, AuthenticationContext, IdentityContext } from './SecurityContext.types';
import { SecurityContextException } from './SecurityContext.types';
import { PolicyResolver } from './PolicyResolver';

export class SecurityContextBuilder {
  static build(
    authentication: AuthenticationContext,
    identity: IdentityContext
  ): EnterpriseContext {
    if (!identity.user || !identity.user.uid) {
      throw new SecurityContextException('Invalid canonical user: missing uid');
    }

    return {
      authentication,
      identity,
      security: PolicyResolver.resolve(identity),
    };
  }

  static buildGuest(): EnterpriseContext {
      return {
          authentication: { uid: '', email: '', provider: '', isAuthenticated: false },
          identity: {
              user: { uid: '', id: '', email: '', displayName: '', accountType: 'madrasah', createdAt: Date.now(), updatedAt: Date.now() } as any,
              assignment: { tenantId: '', portal: 'public', status: 'inactive' }
          },
          security: { uid: '', tenantId: '', role: 'guest', roles: ['guest'], permissions: [], modules: [], features: [], license: { isActive: false }, scope: { level: 'guest' } }
      }
  }
}

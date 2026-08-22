import type { SecurityContext } from './SecurityContext.types';
import { SecurityContextException } from './SecurityContext.types';
import { securityContextService } from '../../security/SecurityContextService';

/**
 * Legacy compatibility facade.
 *
 * This class intentionally cannot construct a SecurityContext from caller
 * supplied identity, role, tenant, or permission data. The sole runtime
 * authority is SecurityContextService.
 */
export class SecurityContextImpl implements SecurityContext {
  private readonly context: SecurityContext;

  constructor() {
    const context = securityContextService.getContext();
    if (!context) {
      throw new SecurityContextException('Canonical SecurityContext is not READY');
    }
    this.context = context as SecurityContext;
  }

  get uid() { return this.context.uid || ''; }
  get tenantId() { return this.context.tenantId || ''; }
  get accountType() { return this.context.accountType || 'madrasah'; }
  get portal() { return this.context.portal || 'madrasah'; }
  get role() { return this.context.role || ''; }
  get roles() { return this.context.roles || []; }
  get permissions() { return this.context.permissions || []; }
  get modules() { return this.context.modules || []; }
  get features() { return this.context.features || []; }
  get license() { return this.context.license || { isActive: false }; }
  get scope() { return this.context.scope || { level: 'tenant' }; }
  get status() { return this.context.status || ''; }
  get isAuthenticated() { return this.context.isAuthenticated === true; }
  get isDeveloper() { return this.context.isDeveloper === true; }
}

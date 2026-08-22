import type { SecurityContext } from './SecurityContext.types';
import { SecurityContextException } from './SecurityContext.types';
import { securityContextService } from '../../security/SecurityContextService';

/**
 * Compatibility facade only.
 *
 * Authorization policy is resolved exclusively by SecurityContextService.
 * This legacy resolver cannot derive tenant, role, permissions, or developer
 * authority from arbitrary IdentityContext input.
 */
export class PolicyResolver {
  static resolve(): SecurityContext {
    const context = securityContextService.getContext();
    if (!context) {
      throw new SecurityContextException('Canonical SecurityContext is not READY');
    }
    return context as SecurityContext;
  }
}

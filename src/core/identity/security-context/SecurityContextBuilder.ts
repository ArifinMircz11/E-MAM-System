import type { EnterpriseContext } from './SecurityContext.types';
import { SecurityContextException } from './SecurityContext.types';
import { securityContextService } from '../../security/SecurityContextService';

/**
 * Compatibility facade only.
 *
 * Authorization state MUST NOT be constructed in this legacy module.
 * SecurityContextService is the sole runtime authority.
 */
export class SecurityContextBuilder {
  static build(): EnterpriseContext {
    const context = securityContextService.getContext();
    if (!context) {
      throw new SecurityContextException('Canonical SecurityContext is not READY');
    }
    return context as EnterpriseContext;
  }

  static buildGuest(): EnterpriseContext {
    throw new SecurityContextException(
      'Guest SecurityContext construction is disabled; canonical context is required',
    );
  }
}

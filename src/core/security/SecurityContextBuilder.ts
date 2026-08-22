import type { SecurityContext } from './SecurityContext';
import { SecurityContextService } from './SecurityContextService';

/**
 * Deprecated compatibility facade.
 * SecurityContextService is the sole runtime authority.
 */
export class SecurityContextBuilder {
  public static fromCanonicalUser(_user: unknown): SecurityContext {
    return SecurityContextService.getContext() as unknown as SecurityContext;
  }

  public static createGuestContext(): SecurityContext {
    throw new Error('Guest SecurityContext construction is disabled; canonical authentication is required.');
  }

  public static createDeveloperContext(): SecurityContext {
    const context = SecurityContextService.getContext();
    if (!context.isDeveloper) {
      throw new Error('Developer SecurityContext construction is disabled; canonical developer identity is required.');
    }
    return context as unknown as SecurityContext;
  }
}

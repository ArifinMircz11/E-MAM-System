import type { SecurityContext } from './types';
import { SecurityContextService } from './SecurityContextService';

/**
 * Compatibility facade only. SecurityContextService is the sole runtime
 * authority; this module must never derive identity from Zustand/UI state.
 */
export function getSecurityContext(strict?: true): SecurityContext;
export function getSecurityContext(strict: false): SecurityContext | null;
export function getSecurityContext(strict: boolean = true): SecurityContext | null {
  try {
    return SecurityContextService.getContext();
  } catch (error) {
    if (strict) throw error;
    return null;
  }
}

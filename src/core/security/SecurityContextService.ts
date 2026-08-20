import { TenantContext, requireActiveTenantId as resolveActiveTenantId } from '../context/TenantContext';
import type { SecurityContext, SecurityLifecycleState } from './types';
import { getSecurityContext } from './contextHelper';

type LifecycleListener = (state: SecurityLifecycleState, ctx: SecurityContext | null) => void;

export class SecurityContextService {
  private static currentState: SecurityLifecycleState = 'BOOTSTRAPPING';
  private static lastError: string | null = null;
  private static listeners: Set<LifecycleListener> = new Set();

  /**
   * Returns the current lifecycle state of SecurityContext
   */
  static getState(): SecurityLifecycleState {
    return this.currentState;
  }

  /**
   * Canonical readiness gate. Returns true ONLY when lifecycle state is READY
   * and a valid SecurityContext can be verified without boundary violations.
   */
  static isReady(): boolean {
    if (this.currentState !== 'READY') {
      return false;
    }
    const ctx = this.getNullableContext();
    if (!ctx || !ctx.uid || !ctx.tenantId || !ctx.role) {
      return false;
    }
    return true;
  }

  /**
   * Authoritatively transitions the SecurityContext lifecycle state.
   */
  static setLifecycleState(state: SecurityLifecycleState, error?: Error | string): void {
    const prevState = this.currentState;
    this.currentState = state;
    this.lastError = error ? (typeof error === 'string' ? error : error.message) : null;

    console.log(`[SecurityContext] ${state}${error ? ` (Error: ${this.lastError})` : ''}`);

    const ctx = this.getNullableContext();
    this.listeners.forEach((listener) => {
      try {
        listener(state, ctx);
      } catch (err) {
        console.error('[SecurityContextService] Error in lifecycle listener:', err);
      }
    });
  }

  /**
   * Retrieves active immutable SecurityContext from TenantContext (Fail Closed)
   */
  static getContext(): SecurityContext {
    return TenantContext.getContext();
  }

  /**
   * Retrieves active SecurityContext if available, or null if not yet ready.
   */
  static getNullableContext(): SecurityContext | null {
    try {
      return getSecurityContext(false);
    } catch {
      return null;
    }
  }

  /**
   * Requires active canonical tenantId from SecurityContext.
   * Throws TENANT_CONTEXT_MISSING if tenantId is missing or empty.
   */
  static requireActiveTenantId(options?: { allowSystem?: boolean }): string {
    return resolveActiveTenantId(options);
  }

  /**
   * Subscribes to SecurityContext lifecycle state changes.
   */
  static subscribe(listener: LifecycleListener): () => void {
    this.listeners.add(listener);
    // Call immediately with current state
    try {
      listener(this.currentState, this.getNullableContext());
    } catch (err) {
      console.error('[SecurityContextService] Error in immediate listener execution:', err);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Resets lifecycle to BOOTSTRAPPING (e.g. for testing)
   */
  static resetForTesting(): void {
    this.currentState = 'BOOTSTRAPPING';
    this.lastError = null;
    this.listeners.clear();
  }
}

export { resolveActiveTenantId as requireActiveTenantId };


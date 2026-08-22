import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import type { SecurityContext, SecurityLifecycleState } from './types';
import { ROLE_PERMISSIONS } from '@/types/permissions';
import { ArchitectureBoundaryError } from '../boundary/ArchitectureBoundaryError';

type LifecycleListener = (state: SecurityLifecycleState, ctx: SecurityContext | null) => void;

const INVALID_TENANTS = new Set(['global', 'default', 'unknown']);

export class SecurityContextService {
  private static currentState: SecurityLifecycleState = 'BOOTSTRAPPING';
  private static lastError: string | null = null;
  private static currentContext: SecurityContext | null = null;
  private static listeners: Set<LifecycleListener> = new Set();

  static getState(): SecurityLifecycleState {
    return this.currentState;
  }

  static isReady(): boolean {
    const ctx = this.currentContext;
    return this.currentState === 'READY' && !!ctx?.uid && !!ctx.tenantId && !!ctx.role;
  }

  /**
   * The only runtime write path for the canonical SecurityContext.
   * Identity, tenant and role are accepted only from the already-resolved CanonicalUser.
   */
  static initialize(canonicalUser: CanonicalUser): SecurityContext {
    if (!canonicalUser?.uid) {
      throw new ArchitectureBoundaryError('identity', 'IDENTITY_UID_MISSING', 'Canonical user membutuhkan UID yang valid.');
    }

    const tenantId = String(canonicalUser.tenantId || '').trim();
    const roles = Array.from(new Set((canonicalUser.roles || []).map((role) => String(role).toLowerCase().trim()).filter(Boolean)));
    const accountType = String(canonicalUser.accountType || 'madrasah').toLowerCase();
    const isDeveloper = accountType === 'developer' || roles.includes('developer');
    const effectiveTenantId = isDeveloper && tenantId === 'system' ? 'system' : tenantId;

    if (!effectiveTenantId || (!isDeveloper && INVALID_TENANTS.has(effectiveTenantId.toLowerCase()))) {
      throw new ArchitectureBoundaryError('tenant', 'TENANT_ACCESS_DENIED', 'Canonical SecurityContext membutuhkan tenantId eksplisit yang valid.');
    }
    if (!roles.length) {
      throw new ArchitectureBoundaryError('security_context', 'SECURITY_CONTEXT_ROLE_MISSING', 'Canonical SecurityContext membutuhkan role.');
    }

    const primaryRole = String(canonicalUser.role || roles[0]).toLowerCase().trim();
    const permissionSet = new Set<any>();
    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
      permissions.forEach((permission) => permissionSet.add(permission));
    }
    if (isDeveloper) permissionSet.add('*');

    const context: SecurityContext = {
      uid: canonicalUser.uid,
      tenantId: effectiveTenantId,
      role: primaryRole,
      roles: isDeveloper && !roles.includes('developer') ? [...roles, 'developer'] : roles,
      permissions: permissionSet,
      accountType,
      isDeveloper,
      scope: { level: isDeveloper ? 'system' : 'tenant', tenantId: effectiveTenantId },
      isAuthenticated: true,
      referenceId: canonicalUser.referenceId,
      status: canonicalUser.status,
    };

    this.currentContext = Object.freeze(context);
    return this.currentContext;
  }

  static clear(): void {
    this.currentContext = null;
  }

  static setLifecycleState(state: SecurityLifecycleState, error?: Error | string): void {
    this.currentState = state;
    this.lastError = error ? (typeof error === 'string' ? error : error.message) : null;
    if (state === 'SIGNED_OUT' || state === 'BOOTSTRAPPING') this.currentContext = null;

    console.log(`[SecurityContext] ${state}${error ? ` (Error: ${this.lastError})` : ''}`);
    const ctx = this.currentContext;
    this.listeners.forEach((listener) => {
      try { listener(state, ctx); } catch (err) { console.error('[SecurityContextService] Error in lifecycle listener:', err); }
    });
  }

  static getContext(): SecurityContext {
    if (!this.currentContext) {
      throw new ArchitectureBoundaryError('security_context', 'SECURITY_CONTEXT_MISSING', 'Security Context belum tersedia. Operasi dibatalkan (Fail-Closed).');
    }
    return this.currentContext;
  }

  static getNullableContext(): SecurityContext | null {
    return this.currentContext;
  }

  static requireActiveTenantId(options?: { allowSystem?: boolean }): string {
    const context = this.getContext();
    if (context.tenantId === 'system' && !options?.allowSystem && !context.isDeveloper) {
      throw new ArchitectureBoundaryError('tenant', 'TENANT_CONTEXT_INVALID', 'Operasi tenant-scoped tidak dapat dijalankan dalam konteks system.');
    }
    return context.tenantId;
  }

  static subscribe(listener: LifecycleListener): () => void {
    this.listeners.add(listener);
    try { listener(this.currentState, this.currentContext); } catch (err) { console.error('[SecurityContextService] Error in immediate listener execution:', err); }
    return () => this.listeners.delete(listener);
  }

  static resetForTesting(): void {
    this.currentState = 'BOOTSTRAPPING';
    this.lastError = null;
    this.currentContext = null;
    this.listeners.clear();
  }
}

export const requireActiveTenantId = (options?: { allowSystem?: boolean }): string => SecurityContextService.requireActiveTenantId(options);

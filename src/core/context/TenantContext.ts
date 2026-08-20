import { useUserStore } from '@/stores/userStore';
import type { Permission } from '@/types/permissions';
import type { SecurityContext } from '../security/types';
import { ArchitectureBoundaryError } from '../boundary/ArchitectureBoundaryError';
import { getSecurityContext } from '../security/contextHelper';

export { type SecurityContext };

export function requireActiveTenantId(options?: { allowSystem?: boolean }): string {
  let context: SecurityContext | null = null;
  try {
    context = TenantContext.getContext();
  } catch {
    context = null;
  }
  
  const tenantId = context?.tenantId;
  
  if (!tenantId || tenantId.trim() === '') {
    throw new ArchitectureBoundaryError(
      'tenant',
      'TENANT_CONTEXT_MISSING',
      'Active tenantId tidak ditemukan dalam SecurityContext. Operasi tenant-scoped dibatalkan (Fail-Closed).'
    );
  }
  
  if (tenantId === 'system' && !options?.allowSystem && !context?.isDeveloper) {
    throw new ArchitectureBoundaryError(
      'tenant',
      'TENANT_CONTEXT_INVALID',
      'Operasi tenant-scoped tidak dapat dijalankan dalam konteks system.'
    );
  }
  
  return tenantId;
}

export class TenantContext {
  /**
   * Retrieves the current security context from the unified contextHelper.
   * Throws an error if no active tenant or user is found.
   */
  static getContext(): SecurityContext {
    const context = getSecurityContext(true);
    if (!context) {
      throw new ArchitectureBoundaryError(
        'security_context',
        'SECURITY_CONTEXT_MISSING',
        'TenantContext Error: Security Context tidak terdefinisi.'
      );
    }
    return context as SecurityContext;
  }

  /**
   * Requires active canonical tenantId or throws TENANT_CONTEXT_MISSING
   */
  static requireActiveTenantId(options?: { allowSystem?: boolean }): string {
    return requireActiveTenantId(options);
  }

  /**
   * Shorthand to get the current tenantId
   */
  static getTenantId(): string {
    return this.getContext().tenantId;
  }

  /**
   * Shorthand to get the current uid
   */
  static getUid(): string {
    return this.getContext().uid;
  }

  /**
   * Validates if a given object belongs to the current tenant.
   * Used as a last-line-of-defense check.
   */
  static validateTenant(entity: { tenantId?: string }): boolean {
    const context = this.getContext();
    if (context.isDeveloper) return true;
    return entity.tenantId === context.tenantId;
  }
}

import type { SecurityContext } from '../security/types';
import { ArchitectureBoundaryError } from '../boundary/ArchitectureBoundaryError';
import { SecurityContextService } from '../security/SecurityContextService';

export { type SecurityContext };

export function requireActiveTenantId(options?: { allowSystem?: boolean }): string {
  try {
    return SecurityContextService.requireActiveTenantId(options);
  } catch (error) {
    if (error instanceof ArchitectureBoundaryError) throw error;
    throw new ArchitectureBoundaryError('tenant', 'TENANT_CONTEXT_MISSING', 'Active tenantId tidak ditemukan dalam SecurityContext. Operasi tenant-scoped dibatalkan (Fail-Closed).');
  }
}

export class TenantContext {
  static getContext(): SecurityContext {
    return SecurityContextService.getContext();
  }

  static requireActiveTenantId(options?: { allowSystem?: boolean }): string {
    return requireActiveTenantId(options);
  }

  static getTenantId(): string {
    return this.getContext().tenantId;
  }

  static getUid(): string {
    return this.getContext().uid;
  }

  static validateTenant(entity: { tenantId?: string }): boolean {
    const context = this.getContext();
    return !!context.isDeveloper || entity.tenantId === context.tenantId;
  }
}

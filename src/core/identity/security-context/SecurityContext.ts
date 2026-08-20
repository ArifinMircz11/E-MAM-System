import type { SecurityContext, AccountType, PortalType } from './SecurityContext.types';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';

export class SecurityContextImpl implements SecurityContext {
  uid: string;
  tenantId: string;
  accountType: AccountType;
  portal: PortalType;
  role: string;
  roles: string[];
  permissions: string[];
  modules: string[];
  features: string[];
  license: { isActive: boolean; expiresAt?: string };
  scope: {
    level: 'global' | 'tenant' | 'guest' | string;
    [key: string]: any;
  };
  status: string;
  isAuthenticated: boolean;
  isDeveloper: boolean;

  constructor(data: Partial<SecurityContext> | any) {
    if (!data) {
      throw new ArchitectureBoundaryError(
        'security_context',
        'SECURITY_CONTEXT_INVALID',
        'Inisialisasi SecurityContext gagal: data tidak tersedia.'
      );
    }

    this.uid = data.uid || data.userId || '';
    if (!this.uid) {
      throw new ArchitectureBoundaryError(
        'identity',
        'IDENTITY_UID_MISSING',
        'SecurityContext membutuhkan UID yang valid.'
      );
    }

    const rawRole = (data.role || (Array.isArray(data.roles) && data.roles[0]) || '').toLowerCase().trim();
    const isDev = Boolean(
      data.isDeveloper ||
      data.accountType === 'developer' ||
      rawRole === 'developer' ||
      (Array.isArray(data.roles) && data.roles.map((r: any) => String(r).toLowerCase()).includes('developer'))
    );

    if (!rawRole && !isDev) {
      throw new ArchitectureBoundaryError(
        'security_context',
        'SECURITY_CONTEXT_INVALID',
        'SecurityContext tidak memiliki role yang valid. Fallback dilarang.'
      );
    }

    this.role = isDev ? 'developer' : rawRole;
    this.roles = Array.isArray(data.roles) && data.roles.length > 0 
      ? Array.from(new Set(data.roles.map((r: any) => String(r).toLowerCase().trim())))
      : [this.role];

    this.accountType = isDev ? 'developer' : (data.accountType || 'madrasah');
    this.portal = isDev ? 'developer' : (data.portal || 'madrasah');
    this.permissions = Array.isArray(data.permissions) ? data.permissions : [];
    this.modules = Array.isArray(data.modules) ? data.modules : [];
    this.features = Array.isArray(data.features) ? data.features : [];
    this.license = data.license || { isActive: false };
    this.status = data.status || 'aktif';
    this.isAuthenticated = data.isAuthenticated !== undefined ? Boolean(data.isAuthenticated) : Boolean(this.uid);
    this.isDeveloper = isDev;

    const rawTenant = data.tenantId;
    if (this.isDeveloper) {
      if (rawTenant && typeof rawTenant === 'string' && rawTenant.trim() !== '' && rawTenant !== 'global' && rawTenant !== 'system') {
        this.tenantId = rawTenant.trim();
        this.scope = data.scope || { level: 'tenant', tenantId: this.tenantId };
      } else {
        this.tenantId = 'global';
        this.scope = data.scope || { level: 'global' };
      }
      this.accountType = 'developer';
      this.role = 'developer';
      if (!this.roles.includes('developer')) {
        this.roles.push('developer');
      }
    } else {
      if (!rawTenant || typeof rawTenant !== 'string' || rawTenant.trim() === '' || rawTenant === 'system' || rawTenant === 'global' || rawTenant === 'default' || rawTenant === 'unknown') {
        throw new ArchitectureBoundaryError(
          'tenant',
          'TENANT_ACCESS_DENIED',
          `Fail-Closed: Invalid or missing explicit tenantId: "${rawTenant}". SecurityContext cannot be constructed with fabricated or empty tenant.`
        );
      }
      this.tenantId = rawTenant.trim();
      this.scope = data.scope || { level: 'tenant', tenantId: this.tenantId };
    }

    // Validasi akhir boundary
    ArchitectureBoundaryEnforcer.enforceSecurityContext({
      uid: this.uid,
      tenantId: this.tenantId,
      role: this.role,
      effectiveRole: this.role,
    });
  }
}


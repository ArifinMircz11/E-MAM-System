import type { SecurityContext } from '@/core/identity/security-context';

export class CapabilityResolver {
  static getCapabilities(context: SecurityContext): string[] {
    if (!context || !context.isAuthenticated) return [];
    
    const capabilities = new Set<string>();
    
    if (context.accountType === 'developer') {
      capabilities.add('PLATFORM_ADMIN');
      capabilities.add('TENANT_MANAGEMENT');
      capabilities.add('DATABASE_MIGRATION');
    }

    if (context.role === 'admin' || (Array.isArray(context.roles) && context.roles.includes('admin'))) {
      capabilities.add('TENANT_ADMIN');
      capabilities.add('USER_MANAGEMENT');
    }

    if (
      context.role === 'guru' ||
      (Array.isArray(context.roles) && (context.roles.includes('guru') || context.roles.includes('wali_kelas')))
    ) {
      capabilities.add('ACADEMIC_OPS');
      capabilities.add('ATTENDANCE_MANAGEMENT');
    }

    return Array.from(capabilities);
  }

  static hasCapability(context: SecurityContext, capability: string): boolean {
    return CapabilityResolver.getCapabilities(context).includes(capability);
  }
}

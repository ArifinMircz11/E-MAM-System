export interface NavigationContext {
  userId: string;
  organizationId: string;
  tenantId: string;
  organizationType: 'DEVELOPER' | 'KANWIL' | 'KEMENAG' | 'MADRASAH';
  roles: string[];
  permissions: string[];
  activeModule: string;
}

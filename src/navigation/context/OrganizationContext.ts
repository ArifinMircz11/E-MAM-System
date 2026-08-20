export interface OrganizationContext {
  organizationId: string;
  type: 'DEVELOPER' | 'KANWIL' | 'KEMENAG' | 'MADRASAH';
  name: string;
  tenantId: string;
}

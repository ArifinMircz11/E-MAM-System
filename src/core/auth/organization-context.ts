/**
 * ORGANIZATION CONTEXT
 * 
 * Mengelola konteks hierarki organisasi (Developer -> Kanwil -> Kemenag -> Madrasah).
 * Digunakan untuk isolasi data dan penentuan cakupan (scope) operasional.
 */

export interface OrganizationContext {
  tenantId: string;
  organizationId: string;
  organizationType: 'DEVELOPER' | 'KANWIL' | 'KEMENAG' | 'MADRASAH';
  ancestors: string[]; // Daftar ID organisasi di atasnya
  children: string[];  // Daftar ID organisasi di bawahnya (jika ada)
  currentScope: string;
}

export const EMPTY_ORGANIZATION_CONTEXT: OrganizationContext = {
  tenantId: '',
  organizationId: '',
  organizationType: 'MADRASAH',
  ancestors: [],
  children: [],
  currentScope: 'MADRASAH'
};

/**
 * Menentukan apakah sebuah organisasi berada dalam jalur hierarki (atas atau bawah).
 */
export function isInHierarchy(context: OrganizationContext, targetId: string): boolean {
  return (
    context.organizationId === targetId ||
    context.ancestors.includes(targetId) ||
    context.children.includes(targetId)
  );
}

import type { CanonicalUser } from './CanonicalUser';
import type { SecurityContext } from '@/core/security/types';

/**
 * IdentityRepository - Interface for identity layer data access.
 */
export interface IdentityRepository {
  getById(context: SecurityContext, id: string): Promise<CanonicalUser | null>;
  getByUid(context: SecurityContext, uid: string): Promise<CanonicalUser | null>;
  getByReferenceId(context: SecurityContext, referenceId: string): Promise<CanonicalUser | null>;
  getByTenant(context: SecurityContext, tenantId: string): Promise<CanonicalUser[]>;
}

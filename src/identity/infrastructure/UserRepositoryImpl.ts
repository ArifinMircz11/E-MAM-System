import { BaseRepository } from '@/repositories/BaseRepository';
import { IdentityRepository } from '../domain/IdentityRepository';
import { CanonicalUser } from '../domain/CanonicalUser';
import type { SecurityContext } from '@/core/security/types';

/**
 * UserRepositoryImpl - Implementation of IdentityRepository using Dexie.
 */
export class UserRepositoryImpl extends BaseRepository<CanonicalUser> implements IdentityRepository {
  constructor() {
    super('users');
  }

  async getById(context: SecurityContext, id: string): Promise<CanonicalUser | null> {
    return await super.getById(context, id);
  }

  async getByUid(context: SecurityContext, uid: string): Promise<CanonicalUser | null> {
    this.validateContext(context, 'getByUid');
    return (await this.table.where('tenantId').equals(context.tenantId).filter((u: CanonicalUser) => u.uid === uid).first()) || null;
  }

  async getByReferenceId(context: SecurityContext, referenceId: string): Promise<CanonicalUser | null> {
    this.validateContext(context, 'getByReferenceId');
    return (await this.table.where('tenantId').equals(context.tenantId).filter((u: CanonicalUser) => u.referenceId === referenceId).first()) || null;
  }

  async getByTenant(context: SecurityContext, tenantId: string): Promise<CanonicalUser[]> {
    this.validateContext(context, 'getByTenant');
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }
}

export const userRepositoryImpl = new UserRepositoryImpl();

import { userRepositoryImpl, UserRepositoryImpl } from '@/identity/infrastructure/UserRepositoryImpl';
import { getSecurityContext } from '@/core/security/contextHelper';

/**
 * Compatibility facade for legacy callers.
 * All operational access is delegated to UserRepositoryImpl so tenant
 * validation, Dexie writes, versioning and SyncQueue remain centralized.
 */
export { UserRepositoryImpl, userRepositoryImpl };

const context = () => getSecurityContext(true);

export const userRepository = {
  getById: async (id: string) => userRepositoryImpl.getById(context(), id),
  getByUid: async (uid: string) => userRepositoryImpl.getByUid(context(), uid),
  getByReferenceId: async (referenceId: string) => userRepositoryImpl.getByReferenceId(context(), referenceId),
  getAll: async (tenantId?: string) => {
    const ctx = context();
    if (tenantId && tenantId !== ctx.tenantId && !ctx.isDeveloper) {
      throw new Error('Tenant access denied');
    }
    return userRepositoryImpl.getAll(ctx);
  },
  save: async (user: any) => userRepositoryImpl.save(context(), user),
  update: async (id: string, updates: any) => userRepositoryImpl.save(context(), { ...updates, id }),
  delete: async (id: string) => userRepositoryImpl.delete(context(), id),
};

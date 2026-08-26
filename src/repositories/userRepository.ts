import { userRepositoryImpl, UserRepositoryImpl } from '@/identity/infrastructure/UserRepositoryImpl';
import { db } from '@/database/db';

export { UserRepositoryImpl, userRepositoryImpl };

export const userRepository = {
  getById: async (id: string) => {
    return (await db.table('users').get(id)) || null;
  },
  getByUid: async (uid: string) => {
    return (await db.table('users').where('uid').equals(uid).first()) || null;
  },
  getByReferenceId: async (referenceId: string) => {
    return (await db.table('users').where('referenceId').equals(referenceId).first()) || null;
  },
  getAll: async (tenantId?: string) => {
    if (tenantId) {
      return await db.table('users').where('tenantId').equals(tenantId).toArray();
    }
    return await db.table('users').toArray();
  },
  save: async (user: any) => {
    return await db.table('users').put(user);
  },
  update: async (id: string, updates: any) => {
    return await db.table('users').update(id, updates);
  },
  delete: async (id: string) => {
    return await db.table('users').delete(id);
  },
};

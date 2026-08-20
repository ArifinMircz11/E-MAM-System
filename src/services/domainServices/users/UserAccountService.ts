import type { SecurityContext } from '@/core/security/types';
import { userRepository } from '@/repositories/userRepository';
import type { User } from '@/domain/entities/user';

export class UserAccountService {
  async getById(context: SecurityContext, id: string): Promise<User | null> {
    return (await userRepository.findById(id, context.tenantId)) as unknown as User;
  }

  async update(context: SecurityContext, user: User): Promise<User> {
    await userRepository.update(user as any);
    return user;
  }

  async delete(context: SecurityContext, id: string): Promise<void> {
    await userRepository.delete(id, context.tenantId);
  }
}

export const userAccountService = new UserAccountService();

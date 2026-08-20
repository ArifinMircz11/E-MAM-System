import type { SecurityContext } from '@/core/security/types';
import { userRoleRepository } from '@/repositories/UserRoleRepository';
import type { UserRole } from '@/types/roles';

export class UserRoleService {
  async updateRoles(context: SecurityContext, userId: string, roles: UserRole[]): Promise<void> {
    await userRoleRepository.updateRoles(context, userId, roles);
  }
}

export const userRoleService = new UserRoleService();

import { userRepository } from '@/repositories/userRepository';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';

/**
 * Development-only pre-auth account discovery.
 *
 * The login UI must not access Dexie directly. This service is the boundary
 * between the pre-auth account picker and the operational database.
 * It is intended for mock/development mode only; production authentication
 * remains responsible for proving identity.
 */
export class PreAuthAccountService {
  async getDevelopmentAccounts(): Promise<CanonicalUser[]> {
    const users = await userRepository.getAllUsers();

    return users
      .filter((user) => user.status !== 'disabled')
      .map((user) => ({
        ...user,
        role: user.role || user.roles?.[0],
        roles: user.roles?.length ? user.roles : user.role ? [user.role] : [],
      }))
      .filter((user) => Boolean(user.role || user.roles?.length));
  }
}

export const preAuthAccountService = new PreAuthAccountService();

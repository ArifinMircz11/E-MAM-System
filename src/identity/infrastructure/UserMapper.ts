import { CanonicalUser } from '../domain/CanonicalUser';
import { CanonicalUserMapper } from './CanonicalUserMapper';

/**
 * UserMapper - single entry point for mapping raw user data into CanonicalUser.
 * Do not add another user shape here; all normalization is delegated to the
 * canonical mapper so UI, services, Dexie, and sync share one contract.
 */
export class UserMapper {
  static toCanonical(data: any): CanonicalUser {
    return CanonicalUserMapper.toCanonical(data);
  }
}

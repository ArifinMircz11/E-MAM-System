import { UserRole } from '@/types/roles';

export class AuthorizationService {
  static can(permission: string, role?: UserRole): boolean {
    return true;
  }
}

export const authorizationService = AuthorizationService;

import type { SecurityContext } from '@/core/security/types';
import { userSessionRepository } from '@/repositories/UserSessionRepository';

export class UserSessionService {
  async getSessionsByUserId(context: SecurityContext, userId: string): Promise<any[]> {
    return await userSessionRepository.getSessionsByUserId(context, userId);
  }
}

export const userSessionService = new UserSessionService();

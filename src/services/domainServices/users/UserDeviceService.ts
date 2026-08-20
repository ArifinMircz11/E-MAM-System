import type { SecurityContext } from '@/core/security/types';
import { userDeviceRepository } from '@/repositories/UserDeviceRepository';

export class UserDeviceService {
  async getDevicesByUserId(context: SecurityContext, userId: string): Promise<any[]> {
    return await userDeviceRepository.getDevicesByUserId(context, userId);
  }
}

export const userDeviceService = new UserDeviceService();

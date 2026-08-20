import { impersonationService as coreImpersonationService } from '@/core/impersonation/ImpersonationService';
import { ImpersonationTargetUser } from '../types/Impersonation';

export class ImpersonationService {
  async start(targetUser: ImpersonationTargetUser, reason: string = 'Developer Support'): Promise<any> {
    return coreImpersonationService.startImpersonation(targetUser, reason);
  }

  async stop(): Promise<void> {
    return coreImpersonationService.stopImpersonation();
  }

  async getActiveSession(): Promise<any> {
    return coreImpersonationService.getActiveSession();
  }
}

export const impersonationService = new ImpersonationService();

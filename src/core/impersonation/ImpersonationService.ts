import { ImpersonationSession } from './ImpersonationSession';

/**
 * Client-side impersonation is intentionally disabled.
 * Impersonation, if reintroduced, must be issued by an authoritative backend
 * after explicit authorization and represented to the client as a read-only
 * session projection.
 */
export class ImpersonationService {
  async startImpersonation(_targetUser: unknown, _reason?: string): Promise<ImpersonationSession> {
    throw new Error('IMPERSONATION_DISABLED: client-side identity mutation is forbidden');
  }

  async stopImpersonation(): Promise<void> {
    throw new Error('IMPERSONATION_DISABLED: client-side identity mutation is forbidden');
  }

  async getActiveSession(): Promise<ImpersonationSession | null> {
    return null;
  }
}

export const impersonationService = new ImpersonationService();

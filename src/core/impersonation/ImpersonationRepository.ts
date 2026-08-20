import { ImpersonationSession } from './ImpersonationSession';

const IMPERSONATION_STORAGE_KEY = 'emam_active_impersonation_session';

export class ImpersonationRepository {
  async saveActiveSession(session: ImpersonationSession): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('[ImpersonationRepository] Failed to save active session:', e);
    }
  }

  async getActiveSession(): Promise<ImpersonationSession | null> {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
      if (!raw) return null;
      const session: ImpersonationSession = JSON.parse(raw);
      if (session.status !== 'ACTIVE') return null;
      return session;
    } catch (e) {
      console.warn('[ImpersonationRepository] Failed to read active session:', e);
      return null;
    }
  }

  async clearActiveSession(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    } catch (e) {
      console.warn('[ImpersonationRepository] Failed to clear active session:', e);
    }
  }
}

export const impersonationRepository = new ImpersonationRepository();

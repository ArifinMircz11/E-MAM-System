import { create } from 'zustand';
import { ImpersonationSessionData, ImpersonationTargetUser } from '../types/Impersonation';

interface ImpersonationState {
  isImpersonating: boolean;
  activeSession: ImpersonationSessionData | null;
  targetUser: ImpersonationTargetUser | null;

  setSession: (session: ImpersonationSessionData | null) => void;
  setTargetUser: (user: ImpersonationTargetUser | null) => void;
  clearImpersonation: () => void;
}

export const useImpersonationStore = create<ImpersonationState>((set) => ({
  isImpersonating: false,
  activeSession: null,
  targetUser: null,

  setSession: (session) =>
    set({
      activeSession: session,
      isImpersonating: !!session && session.status === 'ACTIVE',
    }),
  setTargetUser: (user) => set({ targetUser: user }),
  clearImpersonation: () =>
    set({
      isImpersonating: false,
      activeSession: null,
      targetUser: null,
    }),
}));

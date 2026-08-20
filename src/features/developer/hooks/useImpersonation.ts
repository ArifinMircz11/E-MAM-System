import { useImpersonation as useCoreImpersonation } from '@/core/impersonation/useImpersonation';
import { ImpersonationTargetUser } from '../types/Impersonation';

export const useImpersonation = () => {
  const { isImpersonating, session, startImpersonation, stopImpersonation } = useCoreImpersonation();

  return {
    isImpersonating,
    session,
    startImpersonation: (user: ImpersonationTargetUser, reason?: string) => startImpersonation(user, reason),
    stopImpersonation,
  };
};

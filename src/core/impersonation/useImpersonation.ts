import { useContext } from 'react';
import { ImpersonationContext, ImpersonationContextType } from './ImpersonationContext';

export const useImpersonation = (): ImpersonationContextType => {
  const context = useContext(ImpersonationContext);
  if (!context) {
    // Return a safe fallback if accessed outside Provider
    return {
      isImpersonating: false,
      session: null,
      startImpersonation: async () => {},
      stopImpersonation: async () => {},
    };
  }
  return context;
};

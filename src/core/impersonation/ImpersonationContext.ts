import { createContext } from 'react';
import { ImpersonationSession } from './ImpersonationSession';

export interface ImpersonationContextType {
  isImpersonating: boolean;
  session: ImpersonationSession | null;
  startImpersonation: (targetUser: any, reason?: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

export const ImpersonationContext = createContext<ImpersonationContextType | null>(null);

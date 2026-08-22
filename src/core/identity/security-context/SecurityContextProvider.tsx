import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SecurityContext } from './SecurityContext.types';
import { SecurityContextBuilder } from './SecurityContextBuilder';
import { SecurityContextService } from '@/core/security/SecurityContextService';

interface SecurityContextState {
  securityContext: SecurityContext;
  initialized: boolean;
  refreshContext: () => void;
}

const guestContext = (): SecurityContext => SecurityContextBuilder.buildGuest().security;

const SecurityContextInstance = createContext<SecurityContextState>({
  securityContext: guestContext(),
  initialized: false,
  refreshContext: () => {},
});

export const SecurityContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const project = () => SecurityContextService.getNullableContext() as SecurityContext | null;
  const [securityContext, setSecurityContext] = useState<SecurityContext>(() => project() || guestContext());
  const [initialized, setInitialized] = useState(SecurityContextService.isReady());

  const refreshContext = () => {
    setSecurityContext(project() || guestContext());
    setInitialized(SecurityContextService.isReady());
  };

  useEffect(() => SecurityContextService.subscribe(() => refreshContext()), []);

  return (
    <SecurityContextInstance.Provider value={{ securityContext, initialized, refreshContext }}>
      {children}
    </SecurityContextInstance.Provider>
  );
};

export const useSecurityContext = () => useContext(SecurityContextInstance).securityContext;
export const useSecurityContextState = () => useContext(SecurityContextInstance);

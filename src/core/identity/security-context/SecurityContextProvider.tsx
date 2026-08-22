import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SecurityContext } from '@/core/security/types';
import { SecurityContextService } from '@/core/security/SecurityContextService';

interface SecurityContextState {
  securityContext: SecurityContext | null;
  initialized: boolean;
  refreshContext: () => void;
}

const SecurityContextInstance = createContext<SecurityContextState>({
  securityContext: null,
  initialized: false,
  refreshContext: () => {},
});

export const SecurityContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [securityContext, setSecurityContext] = useState<SecurityContext | null>(() => SecurityContextService.getNullableContext());
  const [initialized, setInitialized] = useState(SecurityContextService.isReady());

  const refreshContext = () => {
    setSecurityContext(SecurityContextService.getNullableContext());
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

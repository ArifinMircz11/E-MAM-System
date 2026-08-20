import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SecurityContext, AuthenticationContext, IdentityContext } from './SecurityContext.types';
import { SecurityContextBuilder } from './SecurityContextBuilder';
import { useAuthStore } from '@/stores/authStore';

interface SecurityContextState {
  securityContext: SecurityContext;
  initialized: boolean;
  refreshContext: () => void;
}

const SecurityContextInstance = createContext<SecurityContextState>({
  securityContext: SecurityContextBuilder.buildGuest().security,
  initialized: false,
  refreshContext: () => {},
});

export const SecurityContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [securityContext, setSecurityContext] = useState<SecurityContext>(() => {
    try {
      if (user) {
        const authContext: AuthenticationContext = { uid: user.uid, email: user.email || '', provider: 'google', isAuthenticated: true };
        const identityContext: IdentityContext = { user, assignment: { referenceId: user.referenceId || undefined, tenantId: user.tenantId || '', portal: user.tenantId ? 'madrasah' : 'public', status: user.status || 'aktif' } };
        return SecurityContextBuilder.build(authContext, identityContext).security;
      }
      return SecurityContextBuilder.buildGuest().security;
    } catch (e) {
      return SecurityContextBuilder.buildGuest().security;
    }
  });
  const [initialized, setInitialized] = useState<boolean>(false);

  const refreshContext = () => {
    try {
      if (user) {
        const authContext: AuthenticationContext = { uid: user.uid, email: user.email || '', provider: 'google', isAuthenticated: true };
        const identityContext: IdentityContext = { user, assignment: { referenceId: user.referenceId || undefined, tenantId: user.tenantId || '', portal: user.tenantId ? 'madrasah' : 'public', status: user.status || 'aktif' } };
        const ctx = SecurityContextBuilder.build(authContext, identityContext);
        setSecurityContext(ctx.security);
      } else {
        setSecurityContext(SecurityContextBuilder.buildGuest().security);
      }
    } catch (e) {
      console.error('Failed to build SecurityContext from user:', e);
      setSecurityContext(SecurityContextBuilder.buildGuest().security);
    } finally {
      setInitialized(true);
    }
  };

  useEffect(() => {
    refreshContext();
  }, [user]);

  return (
    <SecurityContextInstance.Provider value={{ securityContext, initialized, refreshContext }}>
      {children}
    </SecurityContextInstance.Provider>
  );
};

export const useSecurityContext = () => useContext(SecurityContextInstance).securityContext;
export const useSecurityContextState = () => useContext(SecurityContextInstance);

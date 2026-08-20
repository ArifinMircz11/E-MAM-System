import React from 'react';
import { useImpersonation } from './useImpersonation';

interface ImpersonationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ImpersonationGuard: React.FC<ImpersonationGuardProps> = ({ children, fallback = null }) => {
  const { isImpersonating } = useImpersonation();
  if (isImpersonating) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};

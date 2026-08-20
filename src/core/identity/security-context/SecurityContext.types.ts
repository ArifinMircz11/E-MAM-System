import type { CanonicalUser } from '../../../identity/domain/CanonicalUser';

export type AccountType = "developer" | "madrasah" | string;
export type PortalType = "public" | "developer" | "kanwil" | "kankemenag" | "madrasah";

export interface AuthenticationContext {
  uid: string;
  email: string;
  provider: string;
  isAuthenticated: boolean;
}

export interface IdentityContext {
  user: CanonicalUser;
  assignment: {
    referenceId?: string;
    tenantId: string;
    portal: PortalType | string;
    status: any;
  };
  email?: string;
  [key: string]: any;
}

export interface SecurityContext {
  uid?: string;
  userId?: string;
  tenantId?: string;
  role?: string;
  roles?: string[];
  permissions?: any;
  modules?: string[];
  features?: string[];
  license?: {
    isActive: boolean;
    expiresAt?: string;
  };
  scope?: {
    level: 'global' | 'tenant' | 'guest' | string;
    [key: string]: any;
  };
  scopes?: any[];
  isAuthenticated?: boolean;
  accountType?: AccountType;
  isDeveloper?: boolean;
  status?: string;
  portal?: PortalType | string;
  sessionId?: string;
  featureFlags?: Record<string, boolean>;
  [key: string]: any;
}

export interface EnterpriseContext {
  authentication: AuthenticationContext;
  identity: IdentityContext;
  security: SecurityContext;
}

export class SecurityContextException extends Error {
  constructor(message: string) {
    super(`SecurityContextException: ${message}`);
    this.name = 'SecurityContextException';
  }
}

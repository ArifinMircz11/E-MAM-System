import { CanonicalUser } from './canonical-user';

/**
 * SECURITY CONTEXT
 * 
 * Membungkus identitas pengguna dengan konteks operasional saat ini.
 * Digunakan untuk mengevaluasi Policy dan Permission secara dinamis.
 */

export interface SecurityContext {
  user: CanonicalUser | null;
  tenant: {
    id: string;
    status: string;
    settings: Record<string, any>;
  } | null;
  organization: {
    id: string;
    type: string;
    name: string;
  } | null;
  permissions: Set<string>;
  scopes: Set<string>;
  features: Set<string>;
  policies: Record<string, any>;
  isAuthenticated: boolean;
  isReady: boolean;
}

/**
 * Default empty security context.
 */
export const EMPTY_SECURITY_CONTEXT: SecurityContext = {
  user: null,
  tenant: null,
  organization: null,
  permissions: new Set(),
  scopes: new Set(),
  features: new Set(),
  policies: {},
  isAuthenticated: false,
  isReady: false,
};

/**
 * Evaluasi apakah context memiliki permission tertentu.
 */
export function can(context: SecurityContext, permission: string): boolean {
  if (!context.isAuthenticated || !context.user) return false;
  if (context.user.accountType === 'DEVELOPER') return true;
  return context.permissions.has(permission);
}

/**
 * Evaluasi apakah context memiliki salah satu dari daftar permission.
 */
export function canAny(context: SecurityContext, permissions: string[]): boolean {
  return permissions.some(p => can(context, p));
}

/**
 * Evaluasi apakah context memiliki semua permission dalam daftar.
 */
export function canAll(context: SecurityContext, permissions: string[]): boolean {
  return permissions.every(p => can(context, p));
}

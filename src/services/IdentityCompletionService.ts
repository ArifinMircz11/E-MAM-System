/**
 * @license
 * e-Mam System - Identity Completion Service
 * Business logic and orchestration for Canonical User Identity Completion
 */

import { userRepository } from '@/repositories/userRepository';
import { validateCanonicalUser, derivePermissionsForRole } from '@/identity/domain/CanonicalValidation';
import type { CanonicalUser, UserAssignment, UserScope } from '@/identity/domain/CanonicalUser';
import type { AccountType, UserRole } from '@/types/roles';
import { useAuthStore } from '@/stores/authStore';
import { sessionManager } from '@/core/session/sessionManager';
import { toast } from 'sonner';

export interface CompletionPayload {
  tenantId: string;
  accountType: AccountType;
  role: UserRole;
  roles: UserRole[];
  assignment?: UserAssignment;
  scope?: UserScope;
}

export class IdentityCompletionService {
  /**
   * Validate canonical user data against mandatory enterprise standards.
   */
  static validate(user: CanonicalUser | null) {
    return validateCanonicalUser(user);
  }

  /**
   * Complete user profile and store in repository (Dexie + sync queue),
   * derive permissions automatically, update auth store and active session.
   */
  static async completeProfile(uid: string, payload: CompletionPayload): Promise<CanonicalUser> {
    const existing = await userRepository.getByUid(uid);
    if (!existing) {
      throw new Error('Canonical User record not found for UID: ' + uid);
    }

    const derivedPermissions = derivePermissionsForRole(payload.role, payload.roles);

    const updatedUser: CanonicalUser = {
      ...existing,
      tenantId: payload.tenantId,
      accountType: payload.accountType,
      role: payload.role,
      roles: payload.roles,
      permissions: derivedPermissions,
      assignment: payload.assignment || existing.assignment,
      scope: payload.scope || existing.scope,
      status: 'active',
      updatedAt: Date.now(),
      version: (existing.version || 1) + 1,
      syncStatus: 'pending',
    };

    // Save to repository (Dexie + sync queue)
    await userRepository.update(updatedUser);

    // Update active session manager
    sessionManager.setSession({
      uid: updatedUser.uid,
      tenantId: updatedUser.tenantId,
      role: String(updatedUser.role),
      permissions: updatedUser.permissions,
    });

    // Update auth store
    const authStore = useAuthStore.getState();
    authStore.setUser(updatedUser);

    toast.success('Identitas akun berhasil dilengkapi!');
    return updatedUser;
  }

  /**
   * Refresh security session context from stored canonical user.
   */
  static refreshSecurityContext(user: CanonicalUser): void {
    if (!user || !user.uid) return;
    sessionManager.setSession({
      uid: user.uid,
      tenantId: user.tenantId || 'global',
      role: String(user.role || 'user'),
      permissions: user.permissions || [],
    });
  }
}


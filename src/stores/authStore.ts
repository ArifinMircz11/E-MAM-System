import { create } from 'zustand';
import type { UserRole } from '@/types';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';
import { sessionManager } from '@/core/session/sessionManager';
import { LegacyUserAdapter } from '@/core/identity/adapters/LegacyUserAdapter';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';
import { ArchitectureBoundaryError } from '@/core/boundary/ArchitectureBoundaryError';

interface AuthState {
  user: CanonicalUser | null;
  accountStatus: string | null;
  pendingApprovalCount: number;
  setUser: (user: any | null) => void;
  setAccountStatus: (status: string | null) => void;
  setPendingApprovalCount: (count: number) => void;
  setActiveRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, // Sesuai aturan arsitektur: Tidak menggunakan localStorage sebagai sumber kebenaran auth/role
  accountStatus: null,
  pendingApprovalCount: 0,
  setUser: (user) => {
    if (!user) {
      set({ user: null, accountStatus: null });
      sessionManager.clear();
      return;
    }
    const canonicalUser = LegacyUserAdapter.normalizeCanonicalUser(user);
    if (!canonicalUser) {
      throw new ArchitectureBoundaryError(
        'user_contract',
        'USER_CONTRACT_INVALID',
        'Gagal menormalisasi pengguna ke CanonicalUser.'
      );
    }
    const cleanUser: any = sanitizeForJSON(canonicalUser);

    ArchitectureBoundaryEnforcer.enforceUserContract(cleanUser);

    sessionManager.setSession({
      uid: cleanUser.uid,
      tenantId: cleanUser.tenantId,
      role: String(cleanUser.role),
      permissions: cleanUser.permissions || [],
    });

    set({ user: cleanUser as any });
  },
  setAccountStatus: (accountStatus) => {
    set({ accountStatus });
  },
  setPendingApprovalCount: (pendingApprovalCount) => set({ pendingApprovalCount }),
  setActiveRole: (role) => {
    set((state) => {
      if (!state.user) return state;

      // Validasi bahwa role yang dialihkan benar-benar dimiliki oleh user dalam roles[]
      const userRoles = (state.user.roles || []).map((r: any) => String(r).toLowerCase().trim());
      const targetRole = String(role).toLowerCase().trim();
      const isDev = state.user.accountType === 'developer' || userRoles.includes('developer');

      if (!isDev && !userRoles.includes(targetRole)) {
        throw new ArchitectureBoundaryError(
          'rbac',
          'RBAC_ACCESS_DENIED',
          `Pengguna tidak memiliki wewenang untuk beralih ke peran '${role}'. Peran yang tersedia: ${userRoles.join(', ')}`,
          { targetRole, userRoles }
        );
      }

      const updatedUser = { ...state.user, role };
      sessionManager.setSession({
        uid: updatedUser.uid,
        tenantId: updatedUser.tenantId,
        role: String(role),
        permissions: updatedUser.permissions || [],
      });
      return { user: updatedUser };
    });
  },
}));


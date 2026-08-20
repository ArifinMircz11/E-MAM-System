import { create } from 'zustand';
import type { UserAssignment, UserStatus, ApprovalStatus, CanonicalUser } from '@/types';
import { UserRole, AccountType } from '@/types';
import { normalizeUserDataRoles } from '@/utils/roleNormalizer';

interface UserState {
  uid: string | null;
  tenantId: string | null;
  accountType: AccountType | null;
  role: string | null;
  roles: string[];
  assignment: UserAssignment | null;
  status: UserStatus | null;
  approvalStatus: ApprovalStatus | null;
  version: number;
  schemaVersion: number;
  isLoaded: boolean;
  user: CanonicalUser | null;
  referenceId?: string | null;
  idUnik?: string | null;
  email?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  permissionOverrides?: string[];
  scope?: any;
  adminNote?: string | null;
  lastSeen?: number | null;

  setUserData: (data: Partial<UserState>) => void;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  uid: null,
  tenantId: null,
  accountType: null,
  role: null,
  roles: [],
  assignment: null,
  status: null,
  approvalStatus: null,
  version: 1,
  schemaVersion: 1,
  isLoaded: false,
  user: null,
  referenceId: null,
  idUnik: null,
  email: null,
  photoURL: null,
  phoneNumber: null,
  permissionOverrides: [],
  scope: null,
  adminNote: null,
  lastSeen: null,

  setUserData: (data) =>
    set((state) => {
      const mergedInput = { ...state, ...data };
      const normalized = normalizeUserDataRoles(mergedInput, mergedInput.uid || undefined);

      const updated = {
        ...state,
        ...data,
        roles: normalized.roles,
        role: normalized.primaryRole,
        accountType: normalized.accountType as any,
        isLoaded: true,
      };

      // Developer access override
      const developerEmails = ['developer@example.com', 'admin@example.com'];
      // Note: We'd typically check email here if we had it in state, 
      // but the canonical user might not have it. Assuming email comes in data if available.
      const email = (data as any).email;
      const isDev =
        updated.roles.includes(UserRole.DEVELOPER) ||
        (email && developerEmails.includes(email));

      if (isDev) {
        if (!updated.roles.includes(UserRole.DEVELOPER)) {
          updated.roles.push(UserRole.DEVELOPER);
        }
        updated.accountType = AccountType.DEVELOPER;
        if (!updated.tenantId || updated.tenantId === 'default') {
          updated.tenantId = 'global';
        }
      }
      return updated;
    }),
  clearUserData: () =>
    set({
      uid: null,
      tenantId: null,
      accountType: null,
      role: null,
      roles: [],
      assignment: null,
      status: null,
      approvalStatus: null,
      version: 1,
      schemaVersion: 1,
      isLoaded: false,
      user: null,
      referenceId: null,
      idUnik: null,
      email: null,
      photoURL: null,
      phoneNumber: null,
      permissionOverrides: [],
      scope: null,
      adminNote: null,
      lastSeen: null,
    }),
}));

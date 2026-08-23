import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import type { UserRole } from '@/types';
import { LegacyUserAdapter } from '@/core/identity/adapters/LegacyUserAdapter';
import { userRelationRepository } from '@/repositories/UserRelationRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

/**
 * UserSyncService - application workflow for user/master relation reconciliation.
 * Operational data access is delegated to UserRelationRepository.
 */
export class UserSyncService {
  static async syncStudentRelation(user: any, currentUserData: any) {
    try {
      const context = getSecurityContext(false);
      if (!context?.tenantId) return;
      const updatedProfile = await userRelationRepository.reconcileStudentRelation(user.uid, context.tenantId);
      if (!updatedProfile) return;
      if (updatedProfile === currentUserData ||
        ((updatedProfile as any).studentsId === currentUserData.studentsId &&
          (updatedProfile as any).referenceId === currentUserData.referenceId)) return;

      useAuthStore.getState().setUser(updatedProfile);
      useUserStore.getState().setUserData({
        uid: user.uid,
        roles: updatedProfile.roles || [updatedProfile.role as UserRole],
        tenantId: updatedProfile.tenantId,
        isLoaded: true,
      });
      useProfileStore.getState().setProfile(updatedProfile);
    } catch (err) {
      console.error('[UserSyncService] Failed local relation synchronization:', err);
    }
  }

  static mapUserProfile(uid: string, email: string, data: any): any {
    const raw = {
      uid,
      email: email || data.email || '',
      ...data,
    };
    return LegacyUserAdapter.convertLegacyUserToCanonicalUser(raw);
  }
}

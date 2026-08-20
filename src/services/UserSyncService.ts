import { db } from './firebase';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { auditLog } from './auditLogService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import type { UserRole } from '@/types';
import { LegacyUserAdapter } from '@/core/identity/adapters/LegacyUserAdapter';

/**
 * UserSyncService - Handles synchronization between Auth, User Profile,
 * and linked Master Entities (Students/Teachers).
 */
export class UserSyncService {
  /**
   * Synchronizes student relations automatically if a link is detected
   * but the profile is out of sync.
   */
  static async syncStudentRelation(user: any, currentUserData: any) {
    try {
      const roleStr = String(
        currentUserData.role || currentUserData.accountType || '',
      ).toLowerCase();
      const isStudent = ['siswa', 'ketua_kelas', 'student'].includes(roleStr);
      if (!isStudent) return;

      // Query by jangkar link in students collection
      const q = dbGateway.query(
        dbGateway.collection(db, 'students'),
        dbGateway.where('sistemJangkar.userId', '==', user.uid),
        dbGateway.limit(1),
      );

      const querySnap = await dbGateway.getDocs(q);
      if (querySnap.empty) return;

      const studentData = querySnap.docs[0].data();
      const actualStudentId = studentData.studentsId;

      const currentRefId = currentUserData.studentsId || currentUserData.referenceId;

      if (actualStudentId && currentRefId !== actualStudentId) {
        console.log(
          `[UserSyncService] Triggering Relation Sync: ${currentRefId} -> ${actualStudentId}`,
        );

        // Update Cloud Firestore
        await dbGateway.updateDoc(dbGateway.doc(db, 'users', user.uid), {
          studentsId: actualStudentId,
          referenceId: actualStudentId,
          updatedAt: new Date().toISOString(),
        });

        // Audit Trail
        await auditLog({
          action: 'AUTO_RELATION_SYNC',
          category: 'AUTH',
          details: `Sinkronisasi otomatis relasi user UID ${user.uid} dengan student ID ${actualStudentId}`,
        });

        // Update Local Runtime Stores
        const updatedProfile = {
          ...currentUserData,
          studentsId: actualStudentId,
          referenceId: actualStudentId,
        };

        useAuthStore.getState().setUser(updatedProfile);
        useUserStore.getState().setUserData({
          uid: user.uid,
          roles: currentUserData.roles || [currentUserData.role as UserRole],
          tenantId: currentUserData.tenantId,
          isLoaded: true,
        });
        useProfileStore.getState().setProfile(updatedProfile);
      }
    } catch (err) {
      console.error('[UserSyncService] Failed relation synchronization:', err);
    }
  }

  /**
   * Maps raw user document to a clean profile entity using LegacyUserAdapter.
   */
  static mapUserProfile(uid: string, email: string, data: any): any {
    const raw = {
      uid,
      email: email || data.email || '',
      ...data,
    };
    return LegacyUserAdapter.convertLegacyUserToCanonicalUser(raw);
  }
}

import { SyncEngine } from '@/services/SyncEngine';
import { userRepository } from '@/repositories/userRepository';

const guestState = (authUser: any) => ({
  isGuest: true,
  registrationRequired: true,
  uid: authUser.uid,
  email: authUser.email || '',
  displayName: authUser.displayName || '',
  photoURL: authUser.photoURL || null,
  accountType: 'guest',
  role: 'tamu',
  roles: ['tamu'],
  status: 'pending',
  metadata: { registrationRequired: true, reason: 'USER_NOT_REGISTERED' },
});

const hasValidTenant = (tenantId: unknown): tenantId is string => {
  if (typeof tenantId !== 'string') return false;
  const value = tenantId.trim().toLowerCase();
  return value !== '' && !['unknown', 'default', 'global'].includes(value);
};

const hasValidReferenceId = (referenceId: unknown): referenceId is string =>
  typeof referenceId === 'string' && referenceId.trim() !== '';

const hasCanonicalIdentityAnchor = (data: any): boolean =>
  hasValidTenant(data?.tenantId) && hasValidReferenceId(data?.referenceId);

const isRecoverableBootstrapError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return ['timeout', 'offline', 'network', 'unavailable', 'failed to fetch'].some((token) => message.includes(token));
};

/**
 * Authentication identity workflow.
 * Cloud transport is delegated to SyncEngine and local persistence to UserRepository.
 */
export class FirebaseUserSyncService {
  static async syncAuthUser(authUser: any): Promise<any> {
    if (!authUser || typeof authUser.uid !== 'string' || !authUser.uid.trim()) return null;
    const uid = authUser.uid.trim();

    try {
      const data = await SyncEngine.resolveCanonicalUser(uid);
      if (!data) return guestState(authUser);

      if (!hasCanonicalIdentityAnchor(data)) {
        console.warn(`[FirebaseUserSyncService] users/${uid} is missing tenantId/referenceId.`);
        return guestState(authUser);
      }

      await userRepository.cacheAuthoritative(data as any);
      return data;
    } catch (error) {
      if (isRecoverableBootstrapError(error)) {
        const cachedUser = await userRepository.getByUid(uid);
        if (cachedUser && hasCanonicalIdentityAnchor(cachedUser)) {
          console.warn('[FirebaseUserSyncService] Using cached canonical user after recoverable bootstrap failure.');
          return { ...cachedUser, syncStatus: 'pending' };
        }
      }
      console.error('[FirebaseUserSyncService] Canonical identity bootstrap failed:', error);
      throw error;
    }
  }
}

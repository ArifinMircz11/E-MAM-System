/**
 * Canonical identity resolver used during authentication bootstrap.
 *
 * Bootstrap contract:
 * Firebase Auth UID -> users/{uid} -> explicit tenantId/referenceId -> SecurityContext.
 *
 * Domain-reference verification is deliberately NOT performed here. Authentication
 * bootstrap must remain independent from student/teacher reads that may themselves
 * require tenant/RBAC context.
 */
import { db } from '@/services/firebase';
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { localDb } from '@/database/dexie';

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs = 10000,
  errorMessage = 'Timeout',
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

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
  metadata: {
    registrationRequired: true,
    reason: 'USER_NOT_REGISTERED',
  },
});

const hasValidTenant = (tenantId: unknown): tenantId is string => {
  if (typeof tenantId !== 'string') return false;
  const value = tenantId.trim().toLowerCase();
  // `system` is the canonical tenant for global developer identities.
  return value !== '' && !['unknown', 'default', 'global'].includes(value);
};

const hasValidReferenceId = (referenceId: unknown): referenceId is string =>
  typeof referenceId === 'string' && referenceId.trim() !== '';

const hasCanonicalIdentityAnchor = (data: any): boolean =>
  hasValidTenant(data?.tenantId) && hasValidReferenceId(data?.referenceId);

const isRecoverableBootstrapError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('offline') ||
    message.includes('network') ||
    message.includes('unavailable') ||
    message.includes('failed to fetch')
  );
};

export class FirebaseUserSyncService {
  static async syncAuthUser(authUser: any): Promise<any> {
    if (!authUser || typeof authUser.uid !== 'string' || authUser.uid.trim() === '') {
      return null;
    }

    const uid = authUser.uid.trim();
    const userDocRef = firestoreGateway.doc(db, 'users', uid);

    try {
      // Single authoritative Firestore read for authentication bootstrap.
      const userSnap = await withTimeout(
        firestoreGateway.getDoc(userDocRef),
        10000,
        'Firestore users lookup timeout',
      );

      if (!userSnap.exists()) {
        console.info(`[FirebaseUserSyncService] users/${uid} not found; registration required.`);
        return guestState(authUser);
      }

      const rawData = userSnap.data() || {};
      const data = { ...rawData, id: uid, uid };

      // Fail closed for an existing registered identity without canonical anchors.
      if (!hasCanonicalIdentityAnchor(data)) {
        console.warn(
          `[FirebaseUserSyncService] users/${uid} is missing explicit tenantId/referenceId; registration or identity completion is required.`,
        );
        return guestState(authUser);
      }

      await localDb.users.put(data);
      return data;
    } catch (error) {
      // Offline-first recovery: if this device already has a valid canonical user,
      // allow the session to bootstrap from Dexie instead of trapping the UI on login.
      if (isRecoverableBootstrapError(error)) {
        try {
          const cachedUser = await localDb.users.where('uid').equals(uid).first();
          if (cachedUser && hasCanonicalIdentityAnchor(cachedUser)) {
            console.warn('[FirebaseUserSyncService] Using cached canonical user after recoverable bootstrap failure.');
            return { ...cachedUser, syncStatus: 'pending' };
          }
        } catch (cacheError) {
          console.error('[FirebaseUserSyncService] Cached identity recovery failed:', cacheError);
        }
      }

      console.error('[FirebaseUserSyncService] Authoritative users lookup failed:', error);
      throw error;
    }
  }
}

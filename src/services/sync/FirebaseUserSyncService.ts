/**
 * Canonical identity resolver used during authentication bootstrap.
 *
 * Bootstrap contract:
 * Firebase Auth UID -> users/{uid} -> explicit tenantId/referenceId -> SecurityContext.
 *
 * IMPORTANT: domain-reference verification is deliberately NOT performed here.
 * Authentication bootstrap must not depend on a second Firestore read to
 * students/{referenceId} or teachers/{referenceId}. Those reads can be gated by
 * tenant/RBAC rules and create a circular dependency: SecurityContext needs the
 * user document, while the user document would then appear to need SecurityContext.
 * Domain-reference integrity is verified after authentication by the repository/
 * domain layer.
 *
 * This service never provisions or invents identity data.
 */
import { db } from '@/services/firebase';
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { localDb } from '@/database/dexie';

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs = 4000,
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
  const value = tenantId.trim();
  return value !== '' && !['unknown', 'default', 'global'].includes(value);
};

const hasValidReferenceId = (referenceId: unknown): referenceId is string =>
  typeof referenceId === 'string' && referenceId.trim() !== '';

const hasCanonicalIdentityAnchor = (data: any): boolean =>
  hasValidTenant(data?.tenantId) && hasValidReferenceId(data?.referenceId);

export class FirebaseUserSyncService {
  static async syncAuthUser(authUser: any): Promise<any> {
    if (!authUser || typeof authUser.uid !== 'string' || authUser.uid.trim() === '') {
      return null;
    }

    const uid = authUser.uid.trim();
    const userDocRef = firestoreGateway.doc(db, 'users', uid);

    try {
      // This is the single authoritative Firestore read required to bootstrap
      // an authenticated session. Do not add domain reads here.
      const userSnap = await withTimeout(
        firestoreGateway.getDoc(userDocRef),
        4000,
        'Firestore users lookup timeout',
      );

      if (!userSnap.exists()) {
        console.info(`[FirebaseUserSyncService] users/${uid} not found; registration required.`);
        return guestState(authUser);
      }

      const rawData = userSnap.data() || {};
      const data = { ...rawData, id: uid, uid };

      // Fail closed for registered identities with incomplete canonical data,
      // but do not perform another Firestore read during authentication.
      if (!hasCanonicalIdentityAnchor(data)) {
        console.warn(
          `[FirebaseUserSyncService] users/${uid} is missing explicit tenantId/referenceId; registration or identity completion is required.`,
        );
        return guestState(authUser);
      }

      await localDb.users.put(data);
      return data;
    } catch (error) {
      console.error('[FirebaseUserSyncService] Authoritative users lookup failed:', error);
      throw error;
    }
  }
}

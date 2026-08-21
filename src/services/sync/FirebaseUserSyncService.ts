/**
 * @license
 * e-Mam System - Firebase User Sync Service
 *
 * Identity contract:
 * Firebase Auth UID -> Firestore users/{uid} -> referenceId validation.
 *
 * A missing users/{uid} document, or an invalid referenceId, produces an
 * in-memory guest state only. It MUST NOT create a users document and MUST
 * NOT invent tenant/account/role/reference data.
 */

import { db } from '@/services/firebase';
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { localDb } from '@/database/dexie';

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs = 3000,
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
    reason: 'USER_NOT_REGISTERED_OR_REFERENCE_UNRESOLVED',
  },
});

const referenceCollections = (accountType: unknown): string[] => {
  const normalized = String(accountType || '').trim().toLowerCase();
  switch (normalized) {
    case 'student':
    case 'siswa':
      return ['students'];
    case 'teacher':
    case 'guru':
    case 'pendidik':
      return ['teachers'];
    case 'parent':
    case 'orang_tua':
    case 'orangtua':
      return ['orang_tua', 'parents'];
    case 'staff':
    case 'staf':
    case 'admin':
    case 'madrasah':
    case 'kemenag':
    case 'kanwil':
      return ['pengguna', 'madrasah'];
    case 'developer':
      return ['pengguna'];
    default:
      return [];
  }
};

/**
 * Validate that referenceId points to a real domain identity.
 * Firestore remains authoritative; Dexie is only populated after validation.
 */
const referenceIdMatchesDomain = async (data: any): Promise<boolean> => {
  const referenceId = typeof data?.referenceId === 'string' ? data.referenceId.trim() : '';
  if (!referenceId) return false;

  const collections = referenceCollections(data?.accountType);
  if (collections.length === 0) return false;

  for (const collection of collections) {
    try {
      const ref = firestoreGateway.doc(db, collection, referenceId);
      const snap = await withTimeout(
        firestoreGateway.getDoc(ref),
        2500,
        `Reference validation timeout: ${collection}/${referenceId}`,
      );

      if (!snap.exists()) continue;

      const domain = snap.data() || {};
      if (
        typeof data?.tenantId === 'string' &&
        data.tenantId.trim() !== '' &&
        typeof domain?.tenantId === 'string' &&
        domain.tenantId.trim() !== '' &&
        domain.tenantId.trim() !== data.tenantId.trim()
      ) {
        continue;
      }

      return true;
    } catch (error) {
      console.warn(`[FirebaseUserSyncService] Reference validation failed for ${collection}/${referenceId}:`, error);
    }
  }

  return false;
};

export class FirebaseUserSyncService {
  /**
   * Resolve the authenticated user strictly from Firestore.
   * No registered-user fallback is created from Firebase Auth claims.
   */
  static async syncAuthUser(authUser: any): Promise<any> {
    if (!authUser || typeof authUser.uid !== 'string' || authUser.uid.trim() === '') return null;

    const uid = authUser.uid.trim();
    const userDocRef = firestoreGateway.doc(db, 'users', uid);

    try {
      const userSnap = await withTimeout(
        firestoreGateway.getDoc(userDocRef),
        4000,
        'Firestore users lookup timeout',
      );

      // No users/{uid}: guest only. Never provision a users document here.
      if (!userSnap.exists()) {
        console.info(`[FirebaseUserSyncService] users/${uid} not found; registration required.`);
        return guestState(authUser);
      }

      const rawData = userSnap.data() || {};
      const data = { ...rawData, id: uid, uid };

      // Registered identity is valid only when its canonical reference resolves.
      if (!(await referenceIdMatchesDomain(data))) {
        console.warn(
          `[FirebaseUserSyncService] users/${uid} exists but referenceId cannot be validated; treating as guest.`,
        );
        return guestState(authUser);
      }

      // Firestore is authoritative. Do not rewrite role, roles, tenantId,
      // accountType, status, referenceId, email, or displayName on login.
      await localDb.users.put(data);
      return data;
    } catch (error) {
      // A Firestore read failure is NOT equivalent to a missing user.
      // Fail closed instead of inventing an identity from Auth or Dexie.
      console.error('[FirebaseUserSyncService] Authoritative users lookup failed:', error);
      throw error;
    }
  }
}

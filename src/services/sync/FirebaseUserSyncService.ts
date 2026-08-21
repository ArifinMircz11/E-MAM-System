/**
 * @license
 * e-Mam System - Firebase User Sync Service
 *
 * Canonical identity contract:
 * Firebase Auth UID -> Firestore users/{uid} -> referenceId -> domain document.
 * Missing users/{uid} or an invalid referenceId becomes guest state only.
 * Authentication never provisions or invents a users document.
 *
 * Domain identity anchors:
 * - STUDENT/SISWA -> students/{referenceId}
 * - TEACHER/GURU -> teachers/{referenceId}
 */

import { db } from '@/services/firebase';
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { localDb } from '@/database/dexie';

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 3000, errorMessage = 'Timeout'): Promise<T> => {
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

const referenceCollection = (accountType: unknown): 'students' | 'teachers' | null => {
  const normalized = String(accountType || '').trim().toLowerCase();
  if (normalized === 'student' || normalized === 'siswa') return 'students';
  if (normalized === 'teacher' || normalized === 'guru' || normalized === 'pendidik') return 'teachers';
  return null;
};

const referenceIdMatchesDomain = async (data: any): Promise<boolean> => {
  const referenceId = typeof data?.referenceId === 'string' ? data.referenceId.trim() : '';
  if (!referenceId) return false;

  const collection = referenceCollection(data?.accountType);
  if (!collection) return false;

  try {
    const ref = firestoreGateway.doc(db, collection, referenceId);
    const snap = await withTimeout(
      firestoreGateway.getDoc(ref),
      2500,
      `Reference validation timeout: ${collection}/${referenceId}`,
    );

    if (!snap.exists()) return false;

    const domain = snap.data() || {};
    if (
      typeof data?.tenantId === 'string' &&
      data.tenantId.trim() !== '' &&
      typeof domain?.tenantId === 'string' &&
      domain.tenantId.trim() !== '' &&
      domain.tenantId.trim() !== data.tenantId.trim()
    ) return false;

    return true;
  } catch (error) {
    console.warn(`[FirebaseUserSyncService] Reference validation failed for ${collection}/${referenceId}:`, error);
    return false;
  }
};

export class FirebaseUserSyncService {
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

      if (!userSnap.exists()) {
        console.info(`[FirebaseUserSyncService] users/${uid} not found; registration required.`);
        return guestState(authUser);
      }

      const rawData = userSnap.data() || {};
      const data = { ...rawData, id: uid, uid };

      if (!(await referenceIdMatchesDomain(data))) {
        console.warn(`[FirebaseUserSyncService] users/${uid} has no valid canonical reference; treating as guest.`);
        return guestState(authUser);
      }

      // Firestore is authoritative. Do not rewrite identity fields during login.
      await localDb.users.put(data);
      return data;
    } catch (error) {
      // A Firestore failure is not the same as an unregistered account.
      // Fail closed rather than falling back to Auth claims or stale Dexie data.
      console.error('[FirebaseUserSyncService] Authoritative users lookup failed:', error);
      throw error;
    }
  }
}

/**
 * Canonical identity resolver used during authentication bootstrap.
 * Firebase Auth UID -> users/{uid} -> explicit referenceId -> SecurityContext.
 * It never provisions or invents identity data.
 */
import { db } from '@/services/firebase';
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { localDb } from '@/database/dexie';

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 3000, errorMessage = 'Timeout'): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs); });
  return Promise.race([promise, timeoutPromise]).finally(() => { if (timer) clearTimeout(timer); });
};

const guestState = (authUser: any) => ({
  isGuest: true, registrationRequired: true, uid: authUser.uid,
  email: authUser.email || '', displayName: authUser.displayName || '', photoURL: authUser.photoURL || null,
  accountType: 'guest', role: 'tamu', roles: ['tamu'], status: 'pending',
  metadata: { registrationRequired: true, reason: 'USER_NOT_REGISTERED_OR_REFERENCE_UNRESOLVED' },
});

const referenceCollection = (accountType: unknown): 'students' | 'teachers' | null => {
  const normalized = String(accountType || '').trim().toLowerCase();
  if (normalized === 'student' || normalized === 'siswa') return 'students';
  if (normalized === 'teacher' || normalized === 'guru' || normalized === 'pendidik') return 'teachers';
  return null;
};

const hasValidTenant = (tenantId: unknown): tenantId is string =>
  typeof tenantId === 'string' && tenantId.trim() !== '' && !['unknown', 'default', 'global'].includes(tenantId.trim());

const referenceIdMatchesDomain = async (data: any): Promise<boolean> => {
  const referenceId = typeof data?.referenceId === 'string' ? data.referenceId.trim() : '';
  if (!referenceId || !hasValidTenant(data?.tenantId)) return false;

  const collection = referenceCollection(data?.accountType);
  // Organization/system identities do not have a student/teacher document.
  // Their explicit referenceId + tenantId is the canonical identity anchor.
  if (!collection) return true;

  try {
    const ref = firestoreGateway.doc(db, collection, referenceId);
    const snap = await withTimeout(firestoreGateway.getDoc(ref), 2500, `Reference validation timeout: ${collection}/${referenceId}`);
    if (!snap.exists()) return false;
    const domain = snap.data() || {};
    if (typeof domain?.tenantId === 'string' && domain.tenantId.trim() !== '' && domain.tenantId.trim() !== data.tenantId.trim()) return false;
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
      const userSnap = await withTimeout(firestoreGateway.getDoc(userDocRef), 4000, 'Firestore users lookup timeout');
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
      await localDb.users.put(data);
      return data;
    } catch (error) {
      console.error('[FirebaseUserSyncService] Authoritative users lookup failed:', error);
      throw error;
    }
  }
}

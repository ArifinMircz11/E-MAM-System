/**
 * @license
 * e-Mam System - Firebase User Sync Service
 * Automatically provisions Firebase Auth users into Firestore users collection.
 */

import { db } from '@/services/firebase';
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';
import { auditLog } from '@/services/auditLogService';
import { localDb } from '@/database/dexie';

const DEVELOPER_UID = 'developer-uid-placeholder';
const DEVELOPER_EMAIL = 'developer@example.com';

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 2000, errorMessage = 'Timeout'): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

export class FirebaseUserSyncService {
  /**
   * Ensures that the authenticated Firebase Auth user has a corresponding
   * canonical user document in Firestore users/{uid}.
   */
  static async syncAuthUser(authUser: any): Promise<any> {
    if (!authUser || !authUser.uid) return null;

    const uid = authUser.uid;
    const email = authUser.email || '';
    const displayName = authUser.displayName || email.split('@')[0] || 'Pengguna';
    const photoURL = authUser.photoURL || null;
    const isDevAccount =
      uid === DEVELOPER_UID ||
      email.toLowerCase() === DEVELOPER_EMAIL ||
      email.toLowerCase() === 'admin@example.com' ||
      email.toLowerCase() === 'mirzanovilawati@gmail.com';

    try {
      const userDocRef = firestoreGateway.doc(db, 'users', uid);
      const userSnap = await withTimeout(firestoreGateway.getDoc(userDocRef), 2000, 'Firestore getDoc timeout');

      if (!userSnap.exists()) {
        // Phase 2.7 - Activation Request Flow
        // Determine initial status based on account type
        const initialStatus = 'active'; // Guests are active by default
        
        // Create canonical user document
        const newUserData: any = {
          id: uid,
          uid: uid,
          email,
          displayName,
          photoURL,
          accountType: isDevAccount ? 'developer' : 'madrasah',
          role: isDevAccount ? 'developer' : 'tamu', // Default role for new users is TAMU
          roles: isDevAccount ? ['developer'] : ['tamu'],
          status: initialStatus,
          tenantId: isDevAccount ? 'system' : '30315537', // Default tenant
          assignment: null, // No assignment initially
          profile: {
            email,
            displayName,
            photoURL,
          },
          metadata: {
            isActivationRequest: !isDevAccount,
            requestedAt: Date.now(),
          },
          version: 1,
          schemaVersion: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastLoginAt: Date.now(),
          deleted: false,
        };

        try {
          await withTimeout(firestoreGateway.setDoc(userDocRef, newUserData), 1500, 'setDoc timeout');
          await auditLog({
            action: 'CREATE_CANONICAL_USER',
            category: 'AUTH',
            details: `Provisioned canonical user document for UID ${uid} (${email})`,
          });
        } catch (firestoreErr: any) {
          const errMsg = firestoreErr?.message || String(firestoreErr);
          if (
            errMsg.includes('resource-exhausted') ||
            errMsg.includes('Quota exceeded') ||
            errMsg.includes('RESOURCE_EXHAUSTED')
          ) {
            (window as any).__FIRESTORE_QUOTA_EXCEEDED = true;
            console.warn(
              '[FirebaseUserSyncService] Firestore Quota Exceeded during setDoc. Using local Dexie fallback.',
            );
          }
        }

        console.log('PUT USERS', {
          id: (newUserData as any)?.id,
          uid: (newUserData as any)?.uid,
          tenantId: (newUserData as any)?.tenantId,
          email: (newUserData as any)?.email,
          object: newUserData,
        });
        await localDb.users.put(newUserData);
        return newUserData;
      } else {
        const rawData = userSnap.data() || {};
        const data = { id: uid, uid, ...rawData };
        // Check if developer account needs forced sync
        if (isDevAccount && ((data as any).role !== 'developer' || ((data as any).tenantId !== 'system' && (data as any).tenantId !== 'global'))) {
          const devUpdates = {
            id: uid,
            uid,
            accountType: 'developer',
            role: 'developer',
            roles: ['developer'],
            assignment: {
              departmentId: 'it',
              positionId: 'developer',
              scope: { type: 'global', ids: [] },
            },
            tenantId: 'system',
            status: 'active',
            approvalStatus: 'approved',
            permissions: ['*'],
            updatedAt: Date.now(),
            lastLoginAt: Date.now(),
          };
          try {
            await withTimeout(firestoreGateway.updateDoc(userDocRef, devUpdates), 1500, 'updateDoc timeout');
          } catch (e) {
            // ignore quota error
          }
          const merged = { ...data, ...devUpdates, id: uid, uid };
          console.log('PUT USERS', {
            id: (merged as any)?.id,
            uid: (merged as any)?.uid,
            tenantId: (merged as any)?.tenantId,
            email: (merged as any)?.email,
            object: merged,
          });
          await localDb.users.put(merged);
          return merged;
        }

        try {
          await withTimeout(
            firestoreGateway.updateDoc(userDocRef, {
              lastLoginAt: Date.now(),
              updatedAt: Date.now(),
            }),
            1500,
            'updateDoc timeout',
          );
        } catch (e) {
          // ignore quota error
        }

        const dataToSave = { ...data, id: uid, uid };
        
        // Condition 2: If Canonical User exists but has no assignment (and not developer),
        // we might want to ensure they have the TAMU role or handle it in UI.
        // For now, we trust the Firestore data but ensure assignments are synced.
        
        console.log('PUT USERS', {
          id: (dataToSave as any)?.id,
          uid: (dataToSave as any)?.uid,
          tenantId: (dataToSave as any)?.tenantId,
          email: (dataToSave as any)?.email,
          object: dataToSave,
        });
        await localDb.users.put(dataToSave);
        return dataToSave;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('resource-exhausted') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Could not reach Cloud Firestore backend') ||
        errMsg.includes('backend didn\'t respond within') ||
        errMsg.includes('unavailable') ||
        errMsg.includes('timeout') ||
        !navigator.onLine
      ) {
        (window as any).__FIRESTORE_QUOTA_EXCEEDED = true;
        console.warn(
          '[FirebaseUserSyncService] Firestore offline or unreachable. Falling back to local Dexie user.',
        );
      } else {
        console.warn('[FirebaseUserSyncService] Failed to sync auth user to Firestore, using offline mode:', err);
      }

      // Fallback to local Dexie user
      const localUser = await localDb.users.get(uid);
      if (localUser) {
        return localUser;
      }

      // Create fallback local user
      const fallbackUser: any = {
        id: uid,
        uid: uid,
        email,
        displayName,
        photoURL,
        accountType: isDevAccount ? 'developer' : 'madrasah',
        role: isDevAccount ? 'developer' : 'tamu',
        roles: isDevAccount ? ['developer'] : ['tamu'],
        status: 'active',
        tenantId: isDevAccount ? 'global' : '30315537',
        assignment: null,
        profile: {
          email,
          displayName,
          photoURL,
        },
        metadata: {
          isOfflineFallback: true,
          requestedAt: Date.now(),
        },
        version: 1,
        schemaVersion: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false,
      };
      console.log('PUT USERS', {
        id: fallbackUser.id,
        uid: fallbackUser.uid,
        tenantId: fallbackUser.tenantId,
        email: fallbackUser.email,
        object: fallbackUser,
      });
      await localDb.users.put(fallbackUser);
      return fallbackUser;
    }
  }
}


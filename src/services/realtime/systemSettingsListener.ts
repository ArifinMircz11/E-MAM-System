import { db } from '../firebase';
import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';
import { getDocOptimized } from '@/services/sync/firestoreHelpers';

export const subscribeToFeatureLocks = (onUpdate: (locked: string[]) => void) => {
  if (!db) return () => {};

  // Fetch once from Firestore securely (0 cost on cached matches)
  getDocOptimized<any>(dbGateway.doc(db, 'system', 'feature_locks'))
    .then((snap) => {
      if (snap) {
        const data = snap.locked || [];
        onUpdate(data);
      }
    })
    .catch((err) => {
      console.warn('Failed to fetch feature locks configuration:', err);
    });

  return () => {};
};

export const subscribeToRolePermissions = (onUpdate: (perms: Record<string, string[]>) => void) => {
  if (!db) return () => {};

  // Fetch once from Firestore securely
  getDocOptimized<any>(dbGateway.doc(db, 'system', 'role_permissions'))
    .then((snap) => {
      if (snap) {
        const data = snap as Record<string, string[]>;
        // Omit id field if it is added by safe mapping helpers to keep permissions clean
        const { id, ...cleanData } = data;
        onUpdate(cleanData);
      }
    })
    .catch((err) => {
      console.warn('Failed to fetch role permissions configuration:', err);
    });

  return () => {};
};

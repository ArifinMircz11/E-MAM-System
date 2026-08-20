import { getAdminDb, getAdminAuth, getApps } from '../lib/firebase-admin';

/**
 * Initializes Firebase Admin SDK via standard environment configuration
 */
export function initializeFirebaseAdmin(): any {
  return getApps()[0] || null;
}

/**
 * Helper to get Firestore instance
 */
export function getFirestore(): any {
  return getAdminDb();
}


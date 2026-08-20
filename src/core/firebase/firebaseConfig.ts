/**
 * Firebase Configuration Module
 * Follows WO-10.3-INFRA-001 - Environment Configuration Standardization.
 * Reads from centralized env.ts and exports config for initialization.
 */
import { env } from '../config/env';

export const firebaseConfig = {
  apiKey: env.FIREBASE.API_KEY || '',
  authDomain: env.FIREBASE.AUTH_DOMAIN || '',
  projectId: env.FIREBASE.PROJECT_ID || '',
  storageBucket: env.FIREBASE.STORAGE_BUCKET || '',
  messagingSenderId: env.FIREBASE.MESSAGING_SENDER_ID || '',
  appId: env.FIREBASE.APP_ID || '',
  measurementId: env.FIREBASE.MEASUREMENT_ID || '',
};

// Database ID for Firestore (specifically used in some SDK calls)
export const firestoreDatabaseId = env.FIREBASE.DATABASE_ID;

/**
 * Audit:
 * Only Infrastructure Layer (this file and SyncService) should access this config.
 * UI and Domain layers should remain agnostic of these details.
 */

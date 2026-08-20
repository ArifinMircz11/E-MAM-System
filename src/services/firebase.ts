/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin (Lead Developer & System Architect)
 * NIP: 19901004 202521 1012
 * LAYER: INFRASTRUCTURE PROVIDER
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
} from 'firebase/auth';
import type {
  Firestore} from 'firebase/firestore';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  doc,
  getDocFromServer,
  setLogLevel,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { sanitizeForJSON } from '../utils/firestoreHelpers';
import type { Auth, Persistence } from 'firebase/auth';

import { firebaseConfig, firestoreDatabaseId } from '../core/firebase/firebaseConfig';
import { env } from '../core/config/env';

// Build the Firebase configuration favoring environment variables
const coreConfig = firebaseConfig;

// Singleton Pattern for App Initialization
const app = getApps().length > 0 ? getApp() : initializeApp(coreConfig);

// Initialize DB with standard settings. Memory cache is preferred for stable iframe operation.
let db: Firestore;
const firestoreDbId = firestoreDatabaseId === '(default)' ? undefined : firestoreDatabaseId;

console.log('[CoreSystem]: Subsystem Booting...');
try {
  // e-Mam System v7.2 - Using memoryLocalCache for maximum stability in preview iframes
  db = initializeFirestore(
    app,
    {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
    },
    firestoreDbId as string,
  );
  console.log('[CoreSystem]: Primary Sync Engine Initialized with MEMORY CACHE.');
} catch (e) {
  console.warn('DB initialization with cache failed, attempting fallback:', e);
  db = firestoreDbId ? getFirestore(app, firestoreDbId as string) : getFirestore(app);
}

// CRITICAL: Test Connection
async function testConnection() {
  try {
    console.log('[CoreSystem]: Memulai tes koneksi DB...');
    await getDocFromServer(doc(db!, 'test', 'connection'));
    console.log('[CoreSystem]: Koneksi DB berhasil.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[CoreSystem]: Error - DB Offline. Periksa konfigurasi.', error);
    } else {
      console.error(
        '[CoreSystem]: Error - Koneksi DB Gagal (mungkin masalah izin atau nama database):',
        error,
      );
    }
  }
}
// testConnection();
// console.log("[CoreSystem]: Test koneksi dinonaktifkan untuk mencegah error startup.");

let auth: Auth = undefined as any;
const globalAuth = (globalThis as any)._coreAuth;

if (globalAuth) {
  auth = globalAuth;
} else {
  // e-Mam System v7.6 - Advanced Auth Guard to prevent Assertion Errors
  const getExistingAuth = () => {
    try {
      return (app as any).container?.getProvider('auth')?.getImmediate({ optional: true });
    } catch (e) {
      return null;
    }
  };

  const existingAuth = getExistingAuth();
  if (existingAuth) {
    auth = existingAuth;
    (globalThis as any)._coreAuth = auth;
    console.log('[CoreSystem]: Auth Subsystem retrieved from existing container.');
  } else {
    // Dynamically filter storage persistences
    const persistences: Persistence[] = [];
    
    // Check IndexedDB availability safely
    try {
      if (typeof window !== 'undefined' && window.indexedDB) {
        persistences.push(browserLocalPersistence);
      }
    } catch (e) {}

    // Check SessionStorage availability safely
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        persistences.push(browserSessionPersistence);
      }
    } catch (e) {}

    persistences.push(inMemoryPersistence);

    try {
      if (!coreConfig.apiKey || coreConfig.apiKey.includes('YOUR_')) {
        console.log('[CoreSystem]: Firebase API key not configured or placeholder. Running Auth in Mock Mode.');
        throw new Error('API_KEY_UNAVAILABLE (Mock Mode Fallback)');
      }
      // initializeAuth is preferred for custom persistence, but can fail with Assertion Error in some iframes
      auth = initializeAuth(app, {
        persistence: persistences,
        popupRedirectResolver: browserPopupRedirectResolver,
      });
      (globalThis as any)._coreAuth = auth;
      console.log(`[CoreSystem]: Auth Subsystem Initialized (Persistence count: ${persistences.length}).`);
    } catch (initError: any) {
      if (initError?.message?.includes('API_KEY_UNAVAILABLE') || initError?.message?.includes('invalid-api-key') || !coreConfig.apiKey || coreConfig.apiKey.includes('YOUR_')) {
        console.log('[CoreSystem]: Auth Subsystem running in Safe Mock Mode.');
      } else {
        // Standard Firebase error for "already initialized" is 'auth/already-initialized'
        // But we also catch Assertion Errors here
        try {
          auth = getAuth(app);
          (globalThis as any)._coreAuth = auth;
          console.log('[CoreSystem]: Auth Subsystem recovered via getAuth.');
        } catch (e) {
          console.log('[CoreSystem]: Auth Subsystem running in Safe Mock Mode.');
        }
      }
    }
  }
}

const storage = getStorage(app);

// TAMBAHKAN BLOK KODE INI:
if (
  typeof window !== 'undefined' &&
  env.USE_EMULATOR
) {
  connectAuthEmulator(auth!, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

if (env.NODE_ENV === 'production') {
  setLogLevel('silent');
}

// Global Mock Switch - AUTO-FALLBACK TO MOCK MODE IF FIREBASE API KEY IS UNAVAILABLE OR PLACEHOLDER
export const isMockMode = !coreConfig.apiKey || coreConfig.apiKey.includes('YOUR_') || coreConfig.apiKey === '';

let readOnlyMode = false;
let readOnlyTimer: NodeJS.Timeout | null = null;
export const isReadOnly = () => readOnlyMode;
export const setReadOnly = (status: boolean) => {
  readOnlyMode = status;
  if (status) {
    console.warn(
      '[CoreSystem]: Read-only mode enabled due to quota/resource limit. Will attempt auto-reset in 10 minutes.',
    );
    if (readOnlyTimer) clearTimeout(readOnlyTimer);
    readOnlyTimer = setTimeout(() => {
      readOnlyMode = false;
      console.log('[CoreSystem]: Read-only mode auto-reset.');
      readOnlyTimer = null;
    }, 600000); // 10 minutes
  } else {
    if (readOnlyTimer) clearTimeout(readOnlyTimer);
    readOnlyTimer = null;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  READ = 'read',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function safeStringify(obj: any): string {
  try {
    const cleanObj = sanitizeForJSON(obj);
    return JSON.stringify(cleanObj, null, 2);
  } catch (e) {
    return `[Stringify Failed: ${e instanceof Error ? e.message : String(e)}]`;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const user = auth?.currentUser;
  const msg = error instanceof Error ? error.message : String(error);
  const isQuota =
    msg.toLowerCase().includes('quota exceeded') ||
    msg.toLowerCase().includes('resource exhausted') ||
    msg.toLowerCase().includes('429');

  if (isQuota) {
    setReadOnly(true);
    console.error('🔥 e-Mam System CRITICAL: DB Rate Limit Hit. Monitoring active.');
    // Force a small delay to avoid local loop of same error if retrying rapidly
    const now = Date.now();
    if (typeof window !== 'undefined') {
      const lastQuotaMsg = (window as any)._lastQuotaAlert || 0;
      if (now - lastQuotaMsg > 60000) {
        (window as any)._lastQuotaAlert = now;
        // We can't easily import auditLog here due to circularity,
        // but we can dispatch a custom event for the UI to handle logging
        window.dispatchEvent(
          new CustomEvent('emam:quota_exhausted', { detail: { path, operationType } }),
        );
      }
    }
  }

  const errInfo: FirestoreErrorInfo = {
    error: isQuota
      ? 'Resource saat ini terbatas (429/Quota). Sistem beralih ke Mode Read-Only/Cache sementara. Tim teknis sedang menangani hal ini.'
      : msg,
    authInfo: {
      userId: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
      tenantId: user?.tenantId,
      providerInfo:
        user?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (isQuota) {
    console.error('🔥 DB CRITICAL: QUOTA EXCEEDED. Queries will fail until reset.');
  }

  const errorString = safeStringify(errInfo);
  console.error('DB Error: ', errorString);
  throw new Error(errorString);
}

export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';
  let msg = error.message || String(error);

  try {
    // Coba parse jika error message adalah JSON dari handleFirestoreError
    const parsed = JSON.parse(msg);
    if (parsed && parsed.error) {
      msg = parsed.error;
    }
  } catch (e) {
    // Abaikan jika bukan JSON
  }

  // Terjemahkan pesan error umum Firebase
  if (msg.includes('Missing or insufficient permissions')) {
    return 'Akses ditolak. Anda tidak memiliki izin untuk melihat atau mengubah data ini.';
  }
  if (msg.includes('Quota exceeded')) {
    return 'Resource saat ini terbatas. Untuk menjamin performa dan efisiensi data yang lebih tinggi, diperlukan eskalasi kuota infrastruktur pada akun Anda.';
  }
  if (msg.includes('offline')) {
    return 'Koneksi terputus. Periksa jaringan internet Anda.';
  }
  if (msg.includes('auth/user-not-found')) {
    return 'Akun tidak ditemukan.';
  }
  if (msg.includes('auth/wrong-password')) {
    return 'Password yang Anda masukkan salah.';
  }

  return msg;
}

console.log(
  `[CoreSystem]: Modular DB Engine Activated. Mode: ${isMockMode ? 'SIMULATION' : 'PRODUCTION'}`,
);

export { app, auth, db, storage };

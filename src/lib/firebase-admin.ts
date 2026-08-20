import { initializeApp, cert, getApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { serverEnv } from '../core/config/serverEnv';

export { getApp, getApps, initializeApp };

const projectId = serverEnv.FIREBASE_ADMIN.PROJECT_ID;
const databaseId = serverEnv.FIREBASE_ADMIN.DATABASE_ID;

// Initialize Firebase Admin
if (getApps().length === 0) {
  const proj = projectId;

  if (!proj) {
    console.warn(
      'WARNING: FIREBASE_PROJECT_ID is not set. Firebase Admin may not initialize correctly.',
    );
  } else {
    console.log(`Initializing Firebase Admin. Project: ${proj}`);
  }

  try {
    // Check if we have service account credentials
    if (serverEnv.FIREBASE_ADMIN.CLIENT_EMAIL && serverEnv.FIREBASE_ADMIN.PRIVATE_KEY) {
      console.log('Initializing Firebase Admin with Service Account cert...');
      initializeApp({
        projectId: proj || undefined,
        credential: cert({
          projectId: proj || undefined,
          clientEmail: serverEnv.FIREBASE_ADMIN.CLIENT_EMAIL,
          privateKey: serverEnv.FIREBASE_ADMIN.PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Standard initialization for Cloud Run environment using ADC
      console.log('Initializing Firebase Admin with Application Default Credentials...');
      initializeApp({
        projectId: proj || undefined,
        credential: applicationDefault(),
      });
    }
    console.log('Firebase Admin initialized successfully');
  } catch (e: any) {
    console.error('Firebase Admin Initialization Failed with ADC:', e.message);
    // Emergency fallback initialization for local dev without ADC
    try {
      console.log('Attempting fallback initialization...');
      initializeApp({ projectId: proj || undefined });
      console.log('Firebase Admin initialized with fallback');
    } catch (fallbackErr: any) {
      console.error('Firebase Admin Fallback Initialization Failed:', fallbackErr.message);
    }
  }
}

// Lazy-initialized Firestore
let dbInstance: any = null;

export const getAdminDb = () => {
  if (!dbInstance) {
    try {
      const app = getApp();
      if (databaseId && databaseId !== '(default)') {
        dbInstance = getFirestore(app, databaseId);
      } else {
        dbInstance = getFirestore(app);
      }
      console.log('Firestore initialized successfully');
    } catch (error) {
      console.error('Firestore Initialization Error:', error);
      // Emergency fallback
      dbInstance = getFirestore();
    }
  }
  return dbInstance;
};

// Lazy-initialized Auth
let authInstance: any = null;
export const getAdminAuth = () => {
  if (!authInstance) {
    authInstance = getAuth();
  }
  return authInstance;
};

// Lazy-initialized Messaging
let messagingInstance: any = null;
export const getAdminMessaging = () => {
  if (!messagingInstance) {
    messagingInstance = getMessaging();
  }
  return messagingInstance;
};

// For backward compatibility while I update routes
// We use Proxies to ensure these are truly lazy and don't trigger initialization at module load time
export const adminDb = new Proxy({} as any, {
  get: (_, prop) => {
    const db = getAdminDb();
    const value = db[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  },
}) as ReturnType<typeof getAdminDb>;

export const adminAuth = new Proxy({} as any, {
  get: (_, prop) => {
    const auth = getAdminAuth();
    const value = auth[prop];
    return typeof value === 'function' ? value.bind(auth) : value;
  },
}) as ReturnType<typeof getAdminAuth>;

export const adminMessaging = new Proxy({} as any, {
  get: (_, prop) => {
    const messaging = getAdminMessaging();
    const value = messaging[prop];
    return typeof value === 'function' ? value.bind(messaging) : value;
  },
}) as ReturnType<typeof getAdminMessaging>;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  userId?: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || 'server-admin',
    },
    operationType,
    path,
  };
  const jsonError = safeStringify(errInfo);
  console.error('Firestore Error: ', jsonError);
  throw new Error(jsonError);
}

function getCleanValue(value: any, seen: WeakSet<any>): any {
  if (value === null || value === undefined) return value;

  // Handle primitives
  if (typeof value !== 'object' && typeof value !== 'function') return value;
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

  // Handle common types
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error)
    return {
      message: value.message,
      code: (value as any).code,
      name: value.name,
      stack: value.stack?.split('\n').slice(0, 3).join('\n') + '...',
    };

  // Detect circularity
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  // Handle Arrays
  if (Array.isArray(value)) {
    return value.map((item) => getCleanValue(item, seen));
  }

  // Handle Firestore specific types by checking properties/names WITHOUT triggering getters
  try {
    const constructorName = value.constructor?.name;

    // Handle Firestore Timestamps
    if ('seconds' in value && 'nanoseconds' in value) {
      return new Date(value.seconds * 1000).toISOString();
    }

    // Handle Firestore Refs
    if (
      constructorName === 'Firestore' ||
      constructorName === 'DocumentReference' ||
      constructorName === 'CollectionReference' ||
      constructorName === 'Query' ||
      value._delegate ||
      value.firestore ||
      value._query
    ) {
      return `[Firebase ${constructorName || 'Object'}${value.path ? ': ' + value.path : ''}]`;
    }
  } catch (e) {
    return `[Protected Object: ${value.constructor?.name || 'Unknown'}]`;
  }

  // Handle Objects
  const cleanObj: any = {};
  try {
    const keys = Object.keys(value);
    for (const key of keys) {
      if (key.startsWith('_') || key === 'firestore' || key === 'db') continue;
      const val = value[key];
      cleanObj[key] = getCleanValue(val, seen);
    }
  } catch (e) {
    return '[Object with restricted access]';
  }
  return cleanObj;
}

export function safeStringify(obj: any): string {
  try {
    const seen = new WeakSet();
    const cleaned = getCleanValue(obj, seen);
    return JSON.stringify(cleaned, null, 2);
  } catch (e) {
    try {
      return String(obj);
    } catch (finalError) {
      return '[Unstringifiable Object]';
    }
  }
}

export default {
  getApp,
  getApps,
  initializeApp,
  credential: {
    applicationDefault,
    cert
  },
  firestore: {
    FieldValue
  }
};

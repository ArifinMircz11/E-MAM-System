/**
 * e-MAM System - Client Environment Configuration
 * Safe, type-safe client environment configuration handler.
 * ONLY exposes VITE_* variables and public client flags.
 * NEVER includes server secrets (GEMINI_API_KEY, OPENAI_API_KEY, private keys, etc.).
 */

export interface ClientEnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  MODE: string;
  IS_PROD: boolean;
  IS_DEV: boolean;
  IS_TEST: boolean;

  FIREBASE: {
    API_KEY: string;
    AUTH_DOMAIN: string;
    PROJECT_ID: string;
    STORAGE_BUCKET: string;
    MESSAGING_SENDER_ID: string;
    APP_ID: string;
    MEASUREMENT_ID: string;
    DATABASE_ID: string;
  };

  // Compatibility top-level getters
  API_KEY: string;
  AUTH_DOMAIN: string;
  PROJECT_ID: string;
  STORAGE_BUCKET: string;
  MESSAGING_SENDER_ID: string;
  APP_ID: string;
  MEASUREMENT_ID: string;
  DATABASE_ID: string;

  MOCK_MODE: boolean;
  IS_MOCK_MODE: boolean;
  USE_EMULATOR: boolean;
  USE_FIREBASE_EMULATOR: boolean;
}

function getClientRaw(key: string, defaultValue: string = ''): string {
  // Vite client env
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
    const val = import.meta.env[key];
    if (typeof val === 'string') return val;
  }
  // Global injected window env if present
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    return (window as any).__ENV__[key];
  }
  // Process env fallback if present in bundler
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return defaultValue;
}

function isPlaceholder(val: string): boolean {
  if (!val) return true;
  const upper = val.toUpperCase();
  return (
    upper.includes('YOUR_') ||
    upper.includes('PLACEHOLDER') ||
    upper.includes('CHANGE_ME') ||
    upper === 'UNDEFINED'
  );
}

export function buildClientEnvironment(): ClientEnvironmentConfig {
  const rawNodeEnv = getClientRaw('NODE_ENV') || getClientRaw('MODE') || 'development';
  const mode = getClientRaw('MODE') || rawNodeEnv;

  const isProd = rawNodeEnv === 'production' || mode === 'production';
  const isTest = rawNodeEnv === 'test' || mode === 'test';
  const isDev = !isProd && !isTest;

  const nodeEnv: 'development' | 'production' | 'test' = isProd
    ? 'production'
    : isTest
    ? 'test'
    : 'development';

  const firebaseApiKey = getClientRaw('VITE_FIREBASE_API_KEY');
  const firebaseAuthDomain = getClientRaw('VITE_FIREBASE_AUTH_DOMAIN');
  const firebaseProjectId = getClientRaw('VITE_FIREBASE_PROJECT_ID');
  const firebaseStorageBucket = getClientRaw('VITE_FIREBASE_STORAGE_BUCKET');
  const firebaseMessagingSenderId = getClientRaw('VITE_FIREBASE_MESSAGING_SENDER_ID');
  const firebaseAppId = getClientRaw('VITE_FIREBASE_APP_ID');
  const firebaseMeasurementId = getClientRaw('VITE_FIREBASE_MEASUREMENT_ID');
  const firebaseDatabaseId = getClientRaw('VITE_FIREBASE_DATABASE_ID') || '(default)';

  // Fail-closed validation for Production environment.
  // All Firebase client bootstrap fields are required; only analytics/database IDs are optional.
  if (isProd) {
    const requiredFirebaseFields: Array<[string, string]> = [
      ['VITE_FIREBASE_API_KEY', firebaseApiKey],
      ['VITE_FIREBASE_AUTH_DOMAIN', firebaseAuthDomain],
      ['VITE_FIREBASE_PROJECT_ID', firebaseProjectId],
      ['VITE_FIREBASE_STORAGE_BUCKET', firebaseStorageBucket],
      ['VITE_FIREBASE_MESSAGING_SENDER_ID', firebaseMessagingSenderId],
      ['VITE_FIREBASE_APP_ID', firebaseAppId],
    ];

    const invalidFields = requiredFirebaseFields
      .filter(([, value]) => !value || isPlaceholder(value))
      .map(([name]) => name);

    if (invalidFields.length > 0) {
      throw new Error(
        `[ConfigEngine] FAIL-CLOSED: Critical production environment configuration missing or invalid: ${invalidFields.join(
          ', '
        )}. Production boot halted.`
      );
    }
  }

  const rawMock = getClientRaw('VITE_MOCK_MODE') === 'true';
  const rawUseEmulator =
    getClientRaw('USE_FIREBASE_EMULATOR') === 'true' ||
    getClientRaw('VITE_USE_FIREBASE_EMULATOR') === 'true';

  // Mock mode and Firebase emulators are development/test capabilities only.
  const mockMode = isProd ? false : rawMock;
  const useEmulator = isProd ? false : rawUseEmulator;

  if (isProd && rawUseEmulator) {
    throw new Error(
      '[ConfigEngine] FAIL-CLOSED: Firebase emulator configuration is not allowed in production. Production boot halted.'
    );
  }

  const firebaseConfig = {
    API_KEY: firebaseApiKey,
    AUTH_DOMAIN: firebaseAuthDomain,
    PROJECT_ID: firebaseProjectId,
    STORAGE_BUCKET: firebaseStorageBucket,
    MESSAGING_SENDER_ID: firebaseMessagingSenderId,
    APP_ID: firebaseAppId,
    MEASUREMENT_ID: firebaseMeasurementId,
    DATABASE_ID: firebaseDatabaseId,
  };

  return {
    NODE_ENV: nodeEnv,
    MODE: mode,
    IS_PROD: isProd,
    IS_DEV: isDev,
    IS_TEST: isTest,

    FIREBASE: firebaseConfig,

    API_KEY: firebaseApiKey,
    AUTH_DOMAIN: firebaseAuthDomain,
    PROJECT_ID: firebaseProjectId,
    STORAGE_BUCKET: firebaseStorageBucket,
    MESSAGING_SENDER_ID: firebaseMessagingSenderId,
    APP_ID: firebaseAppId,
    MEASUREMENT_ID: firebaseMeasurementId,
    DATABASE_ID: firebaseDatabaseId,

    MOCK_MODE: mockMode,
    IS_MOCK_MODE: mockMode,
    USE_EMULATOR: useEmulator,
    USE_FIREBASE_EMULATOR: useEmulator,
  };
}

export const clientEnv = buildClientEnvironment();
export const getClientEnv = (key: string, defaultValue: string = ''): string => {
  return getClientRaw(key, defaultValue);
};

export default clientEnv;

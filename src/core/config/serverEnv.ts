/**
 * e-MAM System - Server Environment Configuration
 * Strictly for Node.js / Server-Side contexts (server.ts, /api/* handlers, firebase-admin.ts).
 * NEVER import this file into client components or client hooks.
 */

export interface ServerEnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  WHATSAPP_API_TOKEN: string;
  WHATSAPP_GATEWAY_TOKEN: string;
  FIREBASE_ADMIN: {
    PROJECT_ID: string;
    CLIENT_EMAIL: string;
    PRIVATE_KEY: string;
    DATABASE_ID: string;
  };
}

function getServerRaw(key: string, defaultValue: string = ''): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return defaultValue;
}

export function buildServerEnvironment(): ServerEnvironmentConfig {
  const nodeEnv = getServerRaw('NODE_ENV', 'production');
  const portStr = getServerRaw('PORT', '3000');
  const port = parseInt(portStr, 10) || 3000;

  const geminiKey = getServerRaw('GEMINI_API_KEY') || getServerRaw('API_KEY');
  const openaiKey = getServerRaw('OPENAI_API_KEY');
  const waToken = getServerRaw('WHATSAPP_API_TOKEN');
  const waGwToken = getServerRaw('WHATSAPP_GATEWAY_TOKEN');

  const fbProjectId = getServerRaw('FIREBASE_PROJECT_ID') || getServerRaw('VITE_FIREBASE_PROJECT_ID');
  const fbClientEmail = getServerRaw('FIREBASE_CLIENT_EMAIL');
  const fbPrivateKey = getServerRaw('FIREBASE_PRIVATE_KEY');
  const fbDatabaseId = getServerRaw('VITE_FIREBASE_DATABASE_ID', '(default)');

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    GEMINI_API_KEY: geminiKey,
    OPENAI_API_KEY: openaiKey,
    WHATSAPP_API_TOKEN: waToken,
    WHATSAPP_GATEWAY_TOKEN: waGwToken,
    FIREBASE_ADMIN: {
      PROJECT_ID: fbProjectId,
      CLIENT_EMAIL: fbClientEmail,
      PRIVATE_KEY: fbPrivateKey,
      DATABASE_ID: fbDatabaseId,
    },
  };
}

export const serverEnv = buildServerEnvironment();

export function validateServerEnvironment(): boolean {
  if (serverEnv.NODE_ENV === 'production') {
    if (!serverEnv.GEMINI_API_KEY) {
      console.warn('[ServerEnv]: GEMINI_API_KEY is not set in server environment.');
    }
  }
  return true;
}

export const getServerEnv = (key: string, defaultValue: string = ''): string => {
  return getServerRaw(key, defaultValue);
};

export default serverEnv;


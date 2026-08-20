export enum ErrorLayer {
  UI = 'UI_LAYER',
  HOOK = 'HOOK_LAYER',
  SERVICE = 'SERVICE_LAYER',
  FIRESTORE = 'FIRESTORE_LAYER',
  CACHE = 'CACHE_LAYER',
  UNKNOWN = 'UNKNOWN',
}

export interface ClassifiedError {
  layer: ErrorLayer;
  code: string;
  message: string;
  autoFixable: boolean;
  fixStrategy: string;
  originalError: unknown;
}

const ERROR_PATTERNS: Record<string, Omit<ClassifiedError, 'originalError' | 'message'>> = {
  // ── Firestore Errors ────────────────────────────────────
  'permission-denied': {
    layer: ErrorLayer.FIRESTORE,
    code: 'PERMISSION_DENIED',
    autoFixable: false,
    fixStrategy: 'ESCALATE_TO_ADMIN',
  },
  unavailable: {
    layer: ErrorLayer.FIRESTORE,
    code: 'FIRESTORE_OFFLINE',
    autoFixable: true,
    fixStrategy: 'FALLBACK_TO_CACHE',
  },
  offline: {
    layer: ErrorLayer.FIRESTORE,
    code: 'FIRESTORE_OFFLINE',
    autoFixable: true,
    fixStrategy: 'FALLBACK_TO_CACHE',
  },
  'sedang offline': {
    layer: ErrorLayer.FIRESTORE,
    code: 'FIRESTORE_OFFLINE',
    autoFixable: true,
    fixStrategy: 'FALLBACK_TO_CACHE',
  },
  'klien sedang offline': {
    layer: ErrorLayer.FIRESTORE,
    code: 'FIRESTORE_OFFLINE',
    autoFixable: true,
    fixStrategy: 'FALLBACK_TO_CACHE',
  },
  'quota-exceeded': {
    layer: ErrorLayer.FIRESTORE,
    code: 'QUOTA_EXCEEDED',
    autoFixable: true,
    fixStrategy: 'THROTTLE_AND_RETRY',
  },
  'Quota exceeded': {
    layer: ErrorLayer.FIRESTORE,
    code: 'QUOTA_EXCEEDED',
    autoFixable: true,
    fixStrategy: 'THROTTLE_AND_RETRY',
  },
  'resource-exhausted': {
    layer: ErrorLayer.FIRESTORE,
    code: 'QUOTA_EXCEEDED',
    autoFixable: true,
    fixStrategy: 'THROTTLE_AND_RETRY',
  },
  'Resource saat ini terbatas': {
    layer: ErrorLayer.FIRESTORE,
    code: 'QUOTA_EXCEEDED',
    autoFixable: true,
    fixStrategy: 'THROTTLE_AND_RETRY',
  },
  '429': {
    layer: ErrorLayer.FIRESTORE,
    code: 'QUOTA_EXCEEDED',
    autoFixable: true,
    fixStrategy: 'THROTTLE_AND_RETRY',
  },
  Quota: {
    layer: ErrorLayer.FIRESTORE,
    code: 'QUOTA_EXCEEDED',
    autoFixable: true,
    fixStrategy: 'THROTTLE_AND_RETRY',
  },
  'not-found': {
    layer: ErrorLayer.FIRESTORE,
    code: 'DOC_NOT_FOUND',
    autoFixable: true,
    fixStrategy: 'CREATE_DEFAULT_DOC',
  },
  'No document to update': {
    layer: ErrorLayer.FIRESTORE,
    code: 'DOC_NOT_FOUND',
    autoFixable: true,
    fixStrategy: 'IGNORE_OR_DELETE_STALE',
  },

  // ── Cache / IndexedDB Errors ─────────────────────────────
  IndexedDB: {
    layer: ErrorLayer.CACHE,
    code: 'INDEXEDDB_ERROR',
    autoFixable: true,
    fixStrategy: 'REBUILD_CACHE',
  },
  master_version: {
    layer: ErrorLayer.CACHE,
    code: 'VERSION_MISMATCH',
    autoFixable: true,
    fixStrategy: 'FORCE_SYNC',
  },

  // ── Hook / React Errors ───────────────────────────────────
  'Maximum update depth': {
    layer: ErrorLayer.HOOK,
    code: 'INFINITE_LOOP',
    autoFixable: false,
    fixStrategy: 'LOG_AND_RELOAD',
  },
  'WebSocket closed': {
    layer: ErrorLayer.UI,
    code: 'WEBSOCKET_CLOSED',
    autoFixable: true,
    fixStrategy: 'RECONNECT_WEBSOCKET',
  },

  // ── Sweep Errors ──────────────────────────────────────────
  'Sweep sedang dijalankan': {
    layer: ErrorLayer.SERVICE,
    code: 'SWEEP_LOCKED',
    autoFixable: true,
    fixStrategy: 'WAIT_AND_RETRY',
  },
};

export function classifyError(error: unknown): ClassifiedError {
  const message = error instanceof Error ? error.message : String(error);

  // Cocokkan dengan pattern yang dikenal
  for (const [pattern, meta] of Object.entries(ERROR_PATTERNS)) {
    if (message.includes(pattern)) {
      return { ...meta, message, originalError: error };
    }
  }

  // Tidak dikenal
  return {
    layer: ErrorLayer.UNKNOWN,
    code: 'UNKNOWN_ERROR',
    message,
    autoFixable: false,
    fixStrategy: 'ESCALATE_TO_DEVELOPER',
    originalError: error,
  };
}

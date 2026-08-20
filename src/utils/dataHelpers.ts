/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin
 * LAYER: DATA HELPERS (Pure Logic - No Firebase SDK)
 */

/**
 * Removes undefined values from an object recursively.
 * Firestore does not allow undefined values in documents.
 */
export function deepClean(obj: any): any {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
    return obj;
  }

  const constructorName = obj.constructor?.name || '';

  // Identify Firestore special objects (FieldValue, etc.) without importing the SDK
  // We check markers that are present in the serialized objects
  const isFieldValue =
    constructorName.includes('FieldValue') ||
    obj._methodName !== undefined ||
    (obj.constructor && obj.constructor.name === 't');

  const isFirebaseInternal =
    obj._delegate !== undefined || obj.firestore !== undefined || obj._database !== undefined;

  if (isFieldValue || isFirebaseInternal) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClean(item));
  }

  const isPlainObject = Object.prototype.toString.call(obj) === '[object Object]';
  if (!isPlainObject) {
    return obj;
  }

  const cleaned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = deepClean(value);
      }
    }
  }
  return cleaned;
}

export function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'string') return new Error(err);
  if (typeof err === 'object' && err !== null) {
    const obj = err as any;
    const msg = obj.message || obj.error || obj.reason || obj.description || (typeof obj.code === 'string' ? obj.code : null);
    if (typeof msg === 'string') return new Error(msg);
    try {
      const json = JSON.stringify(obj);
      if (json && json !== '{}') return new Error(json);
    } catch {}
  }
  return new Error(String(err || 'Unknown Error'));
}

export function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return toError(err).message;
}

export function sanitizeForJSON<T>(data: unknown, visited = new WeakSet(), depth = 0): T {
  if (data === null || data === undefined) return data as T;

  const type = typeof data;
  if (type !== 'object' && type !== 'function') return data as T;

  if (depth > 8) return '[Max Depth]' as unknown as T;

  try {
    if (visited.has(data as object)) return '[Circular]' as unknown as T;
    visited.add(data as object);
  } catch (e) {
    return '[Uncheckable]' as unknown as T;
  }

  if (type === 'function')
    return `[Function: ${(data as any).name || 'anonymous'}]` as unknown as T;

  if (data instanceof Date) return data.toISOString() as unknown as T;

  if (data instanceof Error) {
    return {
      message: data.message,
      name: data.name,
      stack: data.stack?.split('\n').slice(0, 1).join('\n') + '...',
    } as unknown as T;
  }

  let constructorName = '';
  try {
    const constructor = (data as any).constructor;
    constructorName = constructor?.name || '';
  } catch (e) {}

  const isMinifiedFirebase = constructorName.length > 0 && constructorName.length <= 3;

  const hasFirebaseMarkers =
    (data as any)._delegate ||
    (data as any)._query ||
    (data as any)._path ||
    (data as any).firestore ||
    (data as any).converter ||
    (data as any).database ||
    (data as any).app ||
    (data as any)._database;

  const isFirebaseObject =
    constructorName.includes('DocumentSnapshot') ||
    constructorName.includes('QuerySnapshot') ||
    constructorName.includes('DocumentReference') ||
    constructorName.includes('CollectionReference') ||
    constructorName.includes('Query') ||
    constructorName.includes('Firestore') ||
    constructorName.includes('Transaction') ||
    constructorName.includes('Auth') ||
    constructorName.includes('UserImpl') ||
    isMinifiedFirebase ||
    hasFirebaseMarkers;

  if (isFirebaseObject) {
    return `[Firebase ${constructorName || 'Object'}]` as unknown as T;
  }

  if (typeof (data as any).seconds === 'number' && typeof (data as any).nanoseconds === 'number') {
    try {
      return new Date((data as any).seconds * 1000).toISOString() as unknown as T;
    } catch {
      return `[Timestamp]` as unknown as T;
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForJSON(item, visited, depth + 1)) as unknown as T;
  }

  const result: any = {};
  try {
    const keys = Object.keys(data as object);
    for (const key of keys) {
      if (
        key.startsWith('_') ||
        key.startsWith('$') ||
        [
          'i',
          'src',
          'db',
          'firestore',
          'user',
          'currentUser',
          'app',
          'database',
          'parent',
        ].includes(key)
      ) {
        try {
          const val = (data as any)[key];
          if (typeof val !== 'object' && typeof val !== 'function') {
            result[key] = val;
          } else {
            result[key] = '[Internal/Circular]';
          }
        } catch (e) {
          result[key] = '[Internal/Circular]';
        }
        continue;
      }

      try {
        const value = (data as any)[key];
        result[key] = sanitizeForJSON(value, visited, depth + 1);
      } catch (e) {
        result[key] = '[Unreadable]';
      }
    }
  } catch (e) {
    return `[Object]` as unknown as T;
  }

  return result as T;
}

/**
 * Generates a deterministic-like manual ID for Firestore documents.
 */
export function generateManualId(prefix?: string): string {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return prefix ? `${prefix}_${dateStr}_${random}` : `${dateStr}_${random}`;
}

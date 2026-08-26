/**
 * Firestore and JSON serialization helper
 */

export const sanitizeForJSON = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  try {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'function' || typeof value === 'symbol') {
        return undefined;
      }
      return value;
    }));
  } catch {
    return obj;
  }
};

export const sanitizeFirestoreData = sanitizeForJSON;

export const sanitizeError = (error: any): string => {
  if (!error) return 'Terjadi kesalahan tidak diketahui';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return String(error);
};

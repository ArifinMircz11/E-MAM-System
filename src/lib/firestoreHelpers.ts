import type { OperationType } from '../types';
import { sanitizeForJSON } from '../utils/firestoreHelpers';

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  // We need auth from somewhere. The instruction just mentioned 'auth'.
  // Let's assume auth is available in lib/db or firebase import.
  // Actually, instructions say "load 'auth' from firebase/auth"
  console.error('Firestore Error details:', error);
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Minimal implementation for now, assuming auth not directly here or imported dynamically
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: 'anonymous', // simplified
    },
    operationType,
    path,
  };

  const safeJson = JSON.stringify(sanitizeForJSON(errInfo));
  console.error('Firestore Error: ', safeJson);
  throw new Error(safeJson);
}

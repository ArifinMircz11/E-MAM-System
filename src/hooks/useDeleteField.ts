import { useState, useCallback } from 'react';
import { deleteFirestoreField } from '../services/firestoreService';
import { useAutoFix } from './useAutoFix'; // Ensure this exists or use standard error handling

export function useDeleteField() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { safeCall } = useAutoFix();

  const deleteField = useCallback(
    async (collectionPath: string, documentId: string, fieldPath: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await safeCall(
          () => deleteFirestoreField(collectionPath, documentId, fieldPath),
          'DeleteField.Action',
        );
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to delete field');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [safeCall],
  );

  return { deleteField, isLoading, error };
}

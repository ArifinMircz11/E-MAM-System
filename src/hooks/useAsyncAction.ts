import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { toError } from '@/utils/dataHelpers';

interface AsyncActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncAction() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async <T>(action: () => Promise<T>, options?: AsyncActionOptions<T>) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await action();
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorInstance = toError(err);
        setError(errorInstance);
        if (options?.errorMessage) {
          toast.error(options.errorMessage);
        } else {
          toast.error(errorInstance.message);
        }
        options?.onError?.(errorInstance);
        throw errorInstance;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    isSubmitting,
    error,
    execute,
    setIsSubmitting,
  };
}

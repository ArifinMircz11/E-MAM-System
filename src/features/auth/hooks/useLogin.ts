import { useState, useCallback, useMemo } from 'react';
import { loginWithIdentifier } from '@/services/authService';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    setErrorStr(null);
    try {
      const result = await loginWithIdentifier(identifier, password);
      if (!result.success) {
        setErrorStr(result.error || 'Login gagal');
      }
      return result;
    } catch (e: any) {
      setErrorStr(e.message || 'Login gagal');
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const error = useMemo(
    () => (errorStr ? { message: errorStr, type: 'error' as const } : null),
    [errorStr],
  );

  return useMemo(() => ({ login, loading, error }), [login, loading, error]);
};

import { useState, useCallback, useMemo } from 'react';
import { loginWithIdentifier, loginWithGoogle } from '@/services/authService';
import { UserRole } from '@/types';

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

  const googleLogin = useCallback(async () => {
    setLoading(true);
    setErrorStr(null);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setErrorStr(result.error || 'Login Google gagal');
      }
      return result;
    } catch (e: any) {
      setErrorStr(e.message || 'Login Google gagal');
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const error = useMemo(() => 
    errorStr ? { message: errorStr, type: 'error' as const } : null
  , [errorStr]);

  return useMemo(() => ({ 
    login, 
    googleLogin, 
    loading, 
    error 
  }), [login, googleLogin, loading, error]);
};

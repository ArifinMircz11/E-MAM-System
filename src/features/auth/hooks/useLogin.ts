import { useState, useCallback, useMemo } from 'react';
import { loginWithIdentifier } from '@/services/authService';
import { SecurityContextService } from '@/core/security/SecurityContextService';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    setErrorStr(null);
    try {
      const result = await loginWithIdentifier(identifier, password);

      // Authentication is not considered successful until the single
      // authoritative SecurityContext has reached READY. This closes the
      // legacy offline/mock path that could mutate local stores and return
      // success without establishing authorization context.
      if (result.success && !SecurityContextService.isReady()) {
        SecurityContextService.clear();
        const error = 'Sesi autentikasi belum memiliki SecurityContext authoritative.';
        setErrorStr(error);
        return { success: false, error };
      }

      if (!result.success) {
        setErrorStr(result.error || 'Login gagal');
      }
      return result;
    } catch (e: any) {
      SecurityContextService.clear();
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

import { useState, useCallback, useMemo } from 'react';
import { isMockMode } from '@/services/firebase';
import { loginWithIdentifier } from '@/services/authService';
import { loginOfflineCanonical } from '@/services/auth/OfflineCanonicalSessionService';
import { SecurityContextService } from '@/core/security/SecurityContextService';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    setErrorStr(null);
    try {
      // Offline/mock authentication has its own canonical boundary. It must
      // establish SecurityContextService before any store projection occurs.
      const result = isMockMode || !navigator.onLine
        ? await loginOfflineCanonical(identifier, password, { mock: isMockMode })
        : await loginWithIdentifier(identifier, password);

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

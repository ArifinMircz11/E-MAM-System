import { useEffect, useState } from 'react';
import { onAuthStateChanged } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { AuthBootstrapService } from '@/services/AuthBootstrapService';

/**
 * UI lifecycle adapter only. Authentication business workflow lives in AuthBootstrapService.
 * The listener watchdog guarantees that a broken auth provider cannot hold the
 * entire application behind the splash screen indefinitely.
 */
export const useAuthInitialization = () => {
  const [authLoading, setAuthLoading] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const setAccountStatus = useAuthStore((state) => state.setAccountStatus);
  const setUserData = useUserStore((state) => state.setUserData);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const setProfile = useProfileStore((state) => state.setProfile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const setProfileLoading = useProfileStore((state) => state.setIsLoading);

  useEffect(() => {
    let bootstrapTimer: ReturnType<typeof setTimeout> | null = null;
    let authCallbackReceived = false;
    let disposed = false;

    SecurityContextService.setLifecycleState('BOOTSTRAPPING');

    const finishLoading = () => {
      if (disposed) return;
      setAuthLoading(false);
    };

    // Hard upper bound for the initial auth listener. A failed Firebase/config/
    // service-worker bootstrap must fall back to the login shell, not infinite splash.
    bootstrapTimer = setTimeout(() => {
      if (!authCallbackReceived) {
        console.error('[AuthInit] Auth listener timeout; releasing splash screen.');
        setUser(null);
        clearUserData();
        clearProfile();
        setAccountStatus(null);
        SecurityContextService.setLifecycleState('ERROR', 'AUTH_LISTENER_TIMEOUT');
        finishLoading();
      }
    }, 8000);

    let unsubAuth: (() => void) | undefined;
    try {
      unsubAuth = onAuthStateChanged(async (firebaseUser) => {
        authCallbackReceived = true;
        if (bootstrapTimer) clearTimeout(bootstrapTimer);
        bootstrapTimer = null;

        if (!firebaseUser) {
          setUser(null);
          clearUserData();
          clearProfile();
          setAccountStatus(null);
          finishLoading();
          SecurityContextService.setLifecycleState('SIGNED_OUT');
          return;
        }

        setAuthLoading(true);
        SecurityContextService.setLifecycleState('AUTHENTICATED');

        // Secondary watchdog covers a slow canonical identity bootstrap.
        const identityTimer = setTimeout(finishLoading, 5000);

        try {
          const result = await AuthBootstrapService.initialize(firebaseUser);
          if (disposed) return;

          setUser(result.user);
          setUserData(result.userData);
          setAccountStatus(result.accountStatus as any);
          setProfileLoading(true);
          try {
            setProfile(result.profile);
          } finally {
            setProfileLoading(false);
          }
          SecurityContextService.setLifecycleState('READY');
        } catch (error) {
          if (disposed) return;
          console.error('[AuthInit] Initialization failed:', error);
          setUser(null);
          clearUserData();
          clearProfile();
          setAccountStatus('pending' as any);
          SecurityContextService.setLifecycleState('ERROR', error instanceof Error ? error : String(error));
        } finally {
          clearTimeout(identityTimer);
          finishLoading();
        }
      });
    } catch (error) {
      console.error('[AuthInit] Failed to register auth listener:', error);
      setUser(null);
      clearUserData();
      clearProfile();
      setAccountStatus(null);
      SecurityContextService.setLifecycleState('ERROR', error instanceof Error ? error : String(error));
      finishLoading();
    }

    return () => {
      disposed = true;
      if (bootstrapTimer) clearTimeout(bootstrapTimer);
      unsubAuth?.();
    };
  }, [
    setUser,
    setAccountStatus,
    setUserData,
    clearUserData,
    setProfile,
    clearProfile,
    setProfileLoading,
  ]);

  return { authLoading };
};

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { AuthBootstrapService } from '@/services/AuthBootstrapService';
import { UserRole } from '@/types';

/**
 * UI lifecycle adapter only. Authentication business workflow lives in AuthBootstrapService.
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
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;
    SecurityContextService.setLifecycleState('BOOTSTRAPPING');

    const finishLoading = () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = null;
      setAuthLoading(false);
    };

    const unsubAuth = onAuthStateChanged(async (firebaseUser) => {
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = null;

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
      safetyTimer = setTimeout(finishLoading, 5000);

      try {
        const result = await AuthBootstrapService.initialize(firebaseUser);
        setUser(result.user);
        setUserData(result.userData);
        setAccountStatus(result.accountStatus as any);
        setProfileLoading(true);
        try {
          setProfile(result.profile);
        } finally {
          setProfileLoading(false);
        }
        if (result.linkedStudent) console.info('[AuthInit] Student identity linked successfully.');
        if (result.userData?.role === UserRole.TAMU) {
          SecurityContextService.setLifecycleState('READY');
        } else {
          SecurityContextService.setLifecycleState('READY');
        }
        finishLoading();
      } catch (error) {
        console.error('[AuthInit] Initialization failed:', error);
        setAccountStatus('pending' as any);
        SecurityContextService.setLifecycleState('ERROR', error instanceof Error ? error : String(error));
        finishLoading();
      }
    });

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      unsubAuth();
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

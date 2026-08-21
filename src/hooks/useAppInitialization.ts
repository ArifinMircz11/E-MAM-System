import { useEffect } from 'react';
import { isMockMode } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useSystemStore } from '@/stores/systemStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import { flushPendingAutoFixLogs } from '@/services/sync/autoFixEngine';
import { fetchPendingLettersCount } from '@/services/realtime/pendingLettersListener';
import { UserRole } from '@/types';
import { seedInitialData } from '@/services/seedService';
import { SyncEngine } from '@/services/SyncEngine';
import { AppInitializationService } from '@/services/AppInitializationService';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { useUserStore } from '@/stores/userStore';

/**
 * useAppInitialization - System Level Lifecycle Hook
 *
 * Authentication is intentionally independent from the heavy application
 * initialization sequence. The public login shell must be renderable even when
 * Dexie/schema/system configuration initialization is slow or unavailable.
 */
export const useAppInitialization = () => {
  const updateConnectivity = useAppStore((state) => state.updateConnectivity);
  const setIsOnline = useSystemStore((state) => state.setIsOnline);
  const isOnline = useSystemStore((state) => state.isOnline);
  const tenantId = useUserStore((state) => state.tenantId);

  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.user?.role || UserRole.TAMU);
  const setPendingLetterCount = useNotificationStore((state) => state.setPendingLetterCount);

  // Never block the unauthenticated login shell with Dexie/system bootstrap.
  // Initialization begins once a canonical authenticated user exists.
  useEffect(() => {
    if (!user?.uid) return;
    void AppInitializationService.initialize();
  }, [user?.uid]);

  // Online Manager
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateConnectivity(false);
      toast.success('Koneksi terdeteksi.');
      flushPendingAutoFixLogs();
    };
    const handleOffline = () => {
      setIsOnline(false);
      updateConnectivity(true);
      toast.error('Mode Offline Aktif.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, updateConnectivity]);

  // Automatic system bootstrapping for privileged authenticated users.
  useEffect(() => {
    if (isMockMode || !user || !navigator.onLine) return;

    const bootstrapSistem = async () => {
      const isAdminOrDev = [UserRole.ADMIN as string, UserRole.DEVELOPER as string].includes(userRole);
      if (!isAdminOrDev) return;

      try {
        await seedInitialData();
      } catch (err) {
        console.warn('[Omni-Bootstrap] Seeding skipped or errored:', err);
      }
    };
    void bootstrapSistem();
  }, [user, userRole]);

  // Notification & realtime listeners are only meaningful for authenticated users.
  useEffect(() => {
    if (isMockMode || !user?.uid) return;

    void fetchPendingLettersCount(user.uid, userRole as any).then(setPendingLetterCount);
  }, [user?.uid, userRole, setPendingLetterCount]);

  // Sync Engine lifecycle driven by canonical SecurityContextService.
  useEffect(() => {
    const unsub = SecurityContextService.subscribe((state) => {
      if (state === 'READY' && SecurityContextService.isReady()) {
        SyncEngine.start(10000);
      } else {
        SyncEngine.stop();
      }
    });

    return () => {
      unsub();
      SyncEngine.stop();
    };
  }, []);

  return { isOnline };
};

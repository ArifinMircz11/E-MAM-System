import { useEffect } from 'react';
import { isMockMode } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useStudentStore } from '@/stores/studentStore';
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
 */
export const useAppInitialization = () => {
  const updateConnectivity = useAppStore((state) => state.updateConnectivity);
  const setIsOnline = useSystemStore((state) => state.setIsOnline);
  const isOnline = useSystemStore((state) => state.isOnline);
  const tenantId = useUserStore((state) => state.tenantId);

  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.user?.role || UserRole.TAMU);
  
  const setPendingLetterCount = useNotificationStore((state) => state.setPendingLetterCount);

  // 0. System Initialization Sequence (Enterprise Level)
  useEffect(() => {
    AppInitializationService.initialize();
  }, []);

  // 1. Online Manager
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateConnectivity(false); // isOffline = false
      toast.success('Koneksi terdeteksi.');
      flushPendingAutoFixLogs();
    };
    const handleOffline = () => {
      setIsOnline(false);
      updateConnectivity(true); // isOffline = true
      toast.error('Mode Offline Aktif.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, updateConnectivity]);

  // 2. Automatic System Bootstrapping (Omni-Bootstrap Core Engine Phase 2)
  useEffect(() => {
    if (isMockMode || !user || !navigator.onLine) return;

    const bootstrapSistem = async () => {
      // Security optimization: Only trigger system bootstrapping checks for admin or developer.
      const isAdminOrDev = [UserRole.ADMIN as string, UserRole.DEVELOPER as string].includes(userRole);
      if (!isAdminOrDev) return;

      try {
        await seedInitialData();
      } catch (err) {
        console.warn('[Omni-Bootstrap] Seeding skipped or errored:', err);
      }
    };
    bootstrapSistem();
  }, [user, userRole]);

  // 3. Notification & Realtime Listeners managed centrally
  useEffect(() => {
    if (isMockMode || !user?.uid) return;

    // Initial letters counts
    fetchPendingLettersCount(user.uid, userRole as any).then(setPendingLetterCount);
  }, [user?.uid, userRole, setPendingLetterCount]);

  // 4. Sync Engine Lifecycle driven by canonical SecurityContextService
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

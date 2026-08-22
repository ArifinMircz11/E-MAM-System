import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useStudentStore } from '@/stores/studentStore';
import { useUIStore } from '@/stores/uiStore';
import { useUserStore } from '@/stores/userStore';
import { useSystemStore } from '@/stores/systemStore';
import { UserRole } from '@/types';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { PendingApprovalListener } from '@/core/realtime/listeners/PendingApprovalListener';
import { realtimeLifecycle } from '@/core/realtime/RealtimeLifecycle';

export const useRealtimeSubscriptions = () => {
  const user = useAuthStore((s) => s.user);
  const userRole = useAuthStore((s) => s.user?.role || UserRole.TAMU);
  const isUserLoaded = useUserStore((s) => s.isLoaded);
  const isOnline = useSystemStore((s) => s.isOnline);

  const setUnreadNotifCount = useNotificationStore((s) => s.setUnreadCount);
  const setUnreadChatCount = useNotificationStore((s) => s.setUnreadChatCount);
  const setPendingApprovalCount = useAuthStore((s) => s.setPendingApprovalCount);
  const setMasterVersion = useStudentStore((s) => s.setMasterVersion);
  const setLockedFeatures = useUIStore((s) => s.setLockedFeatures);
  const setRolePermissions = useUIStore((s) => s.setRolePermissions);

  const { masterVersion, featureLocks, rolePermissions } = useSystemConfig();
  const { count: unreadCount } = useUnreadNotifications();

  useEffect(() => {
    if (masterVersion) {
      const verNum =
        typeof masterVersion === 'number' ? masterVersion : parseFloat(masterVersion) || 1;
      useStudentStore.setState((state) => {
        if (state.masterVersion === verNum) return state;
        return { ...state, masterVersion: verNum };
      });

      const tenantId = user?.tenantId;
      if (tenantId) {
        import('@/services/masterSyncService').then(({ masterSyncService }) => {
          masterSyncService.checkAndSyncMasterData(tenantId, verNum).catch((err) => {
            console.error('[useRealtimeSubscriptions] checkAndSyncMasterData failed:', err);
          });
        });
      }
    }
  }, [masterVersion, user?.tenantId]);

  useEffect(() => {
    if (unreadCount !== undefined) {
      setUnreadNotifCount(unreadCount);
    }
  }, [unreadCount, setUnreadNotifCount]);

  const [isWindowFocused, setIsWindowFocused] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true,
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => setIsWindowFocused(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const hasSubscribedApprovals = useRef(false);

  useEffect(() => {
    realtimeLifecycle.initialize();
  }, []);

  useEffect(() => {
    if (!isUserLoaded || !user?.uid || !isWindowFocused || !isOnline) {
      if (hasSubscribedApprovals.current) {
        PendingApprovalListener.deactivate();
        hasSubscribedApprovals.current = false;
      }
      return;
    }

    if (
      !hasSubscribedApprovals.current &&
      [UserRole.ADMIN as string, UserRole.DEVELOPER as string, 'admin', 'developer'].includes(userRole)
    ) {
      PendingApprovalListener.activate(
        true,
        user.tenantId || undefined,
        setPendingApprovalCount
      );
      hasSubscribedApprovals.current = true;
    }

    return () => {
      if (hasSubscribedApprovals.current) {
        PendingApprovalListener.deactivate();
        hasSubscribedApprovals.current = false;
      }
    };
  }, [isUserLoaded, user?.uid, userRole, isWindowFocused, isOnline, user?.tenantId, setPendingApprovalCount]);
};

// src/core/realtime/RealtimeContextResolver.ts
// Context Resolver for Realtime Subscriptions in e-MAM System V7.7

import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useSystemStore } from '@/stores/systemStore';
import { useImpersonationStore } from '@/features/developer/stores/impersonationStore';
import { RealtimeContext } from './RealtimeSubscription';

export class RealtimeContextResolver {
  /**
   * Resolves the current runtime RealtimeContext from active state stores.
   */
  static resolveContext(): RealtimeContext {
    const authUser = useAuthStore.getState().user;
    const tenantId = useUserStore.getState().tenantId || authUser?.tenantId;
    const isOnline = useSystemStore.getState().isOnline;
    const isImpersonating = useImpersonationStore.getState().isImpersonating;

    const isWindowFocused =
      typeof document !== 'undefined' ? !document.hidden : true;

    return {
      userId: authUser?.uid,
      userRole: authUser?.role,
      tenantId: tenantId || undefined,
      organizationId: (authUser as any)?.organizationId || undefined,
      isImpersonating: !!isImpersonating,
      isOnline: isOnline ?? true,
      isWindowFocused,
    };
  }
}

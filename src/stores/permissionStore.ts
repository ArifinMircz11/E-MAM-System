import { create } from 'zustand';
import type { UserRole } from '@/types';

interface PermissionState {
  checkPermission: (requiredRoles: UserRole[]) => boolean;
}

export const usePermissionStore = create<PermissionState>((_set, get) => ({
  checkPermission: (requiredRoles) => {
    // This will be used in components, accessing userStore data
    // Usually we would use it with useUserStore.getState()
    return false; // Logic will be implemented in the components/guards using selectors
  },
}));

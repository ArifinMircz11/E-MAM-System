import { can } from '@/services/securityService';
import { useUserStore } from '@/stores/userStore';
import type { Permission } from '@/types/permissions';

export function useSecurity() {
  const roles = useUserStore((state) => state.roles);

  const canCheck = (permission: Permission): boolean => {
    return can(permission);
  };

  return {
    can: canCheck,
    roles,
  };
}

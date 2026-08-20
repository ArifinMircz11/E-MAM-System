import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

export function useContextualActionButton() {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const hours = new Date().getHours();
    const isMorning = hours >= 0 && hours < 12;

    const label = isMorning ? 'Absensi' : 'Laporan';
    const actionType = isMorning ? 'PRESENSI' : 'LAPORAN';

    // RBAC Check: Only certain roles can perform these actions
    const canPerformAction =
      user?.role && [UserRole.GURU as string, UserRole.WALI_KELAS as string, UserRole.SISWA as string].includes(user.role);

    return {
      label,
      actionType,
      canPerformAction,
    };
  }, [user?.role]);
}

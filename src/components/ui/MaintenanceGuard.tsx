import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSystemStore } from '@/stores/systemStore';
import { UserRole } from '@/types';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { MaintenanceOverlay } from './MaintenanceOverlay';

const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const { maintenanceMode: isMaintenanceActive, loading } = useSystemConfig();
  const isOnline = useSystemStore((state) => state.isOnline);
  const user = useAuthStore((state) => state.user);

  // Local state to allow developer bypass (to reach the login screen)
  const [isBypassed, setIsBypassed] = useState(false);

  const role = user?.role || UserRole.TAMU;

  if (loading && isOnline)
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  // Domain Disconnected check (only block with full-screen overlay if maintenance mode is active)
  if (!isOnline && isMaintenanceActive) {
    return (
      <MaintenanceOverlay
        isDisconnected={true}
        title="Koneksi"
        message="Domain tidak terjangkau atau koneksi terputus. Pastikan perangkat terhubung ke internet."
      />
    );
  }

  // Only real developers are allowed when maintenance is active
  const isUserDeveloper = role === UserRole.DEVELOPER || user?.email === 'developer@example.com';

  if (isMaintenanceActive && !isUserDeveloper && !isBypassed) {
    return (
      <MaintenanceOverlay
        isDeveloper={true}
        onBypass={() => setIsBypassed(true)}
        title="Sistem e-MAM"
        message="Aplikasi sedang dalam pemeliharaan sistem (Maintenance Mode). Hanya akun Developer yang dapat mengakses masuk."
      />
    );
  }

  // Jika tidak maintenance, atau user adalah Developer, tampilkan aplikasi
  return <>{children}</>;
};

export default MaintenanceGuard;

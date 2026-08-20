// src/hooks/useSystemConfig.ts
// ✅ GANTIKAN 3 listener: master_version, feature_locks, role_permissions
// ✅ HEMAT: 3 listener → 1 listener (-66%)
// ✅ GLOBAL: Menggunakan useSystemStore untuk membagi state antar komponen

import { useEffect, useCallback, useMemo } from 'react';
import { useSystemStore } from '@/stores/systemStore';

export function useSystemConfig() {
  const config = useSystemStore((s) => s.systemConfig);
  const loading = useSystemStore((s) => s.isConfigLoading);
  const fetchConfig = useSystemStore((s) => s.fetchSystemConfig);

  useEffect(() => {
    // Note: Initial fetch is now handled centrally by AppInitializationService.
    // fetchConfig() call removed to prevent redundant initialization logs.

    // Listen for manual re-sync requests or tab visibility
    if (typeof window !== 'undefined') {
      const handleResync = () => fetchConfig(true);
      window.addEventListener('realtime:resubscribe', handleResync);
      return () => window.removeEventListener('realtime:resubscribe', handleResync);
    }
    return;
  }, [fetchConfig]);

  const normalizedLocks = useMemo(() => {
    const rawLocks = config?.featureLocks || [];
    return Array.isArray(rawLocks)
      ? rawLocks
      : rawLocks && typeof rawLocks === 'object'
        ? Object.keys(rawLocks).filter((k) => (rawLocks as any)[k] === true)
        : [];
  }, [config?.featureLocks]);

  return useMemo(
    () => ({
      config,
      loading,
      masterVersion: config?.masterVersion || 1,
      featureLocks: normalizedLocks,
      rolePermissions: config?.rolePermissions || {},
      emergencyAlert: config?.emergencyAlert || null,
      maintenanceMode: config?.maintenanceMode || false,
      isFeatureLocked: (feature: string) => normalizedLocks.includes(feature),
      hasPermission: (role: string, permission: string) =>
        config?.rolePermissions?.[role]?.includes(permission) ?? false,
    }),
    [config, loading, normalizedLocks],
  );
}

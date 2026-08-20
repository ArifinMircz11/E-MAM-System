import { create } from 'zustand';
import type { Teacher, MadrasahData } from '@/types';
import { getSystemConfigWithCache, fetchMadrasahInfo as getMadrasahInfo } from '../services/systemService';
import { getTeachers as fetchTeachersFromService } from '../services/teacherService';
import { getDashboardSummary } from '../services/summaryFirestoreService';
import { useUIStore } from './uiStore';
import { useStudentStore } from './studentStore';

interface SystemState {
  teachers: Teacher[];
  madrasahInfo: MadrasahData | null;
  systemStats: any;
  isOnline: boolean;
  lastFetched: {
    teachers: number | null;
    madrasahInfo: number | null;
    systemStats: number | null;
    systemConfig: number | null;
  };
  systemConfig: any;
  isConfigLoading: boolean;

  // Actions
  setIsOnline: (online: boolean) => void;
  fetchTeachers: (force?: boolean) => Promise<Teacher[]>;
  fetchMadrasahInfo: (force?: boolean) => Promise<MadrasahData | null>;
  fetchSystemStats: (force?: boolean) => Promise<any>;
  fetchSystemConfig: (force?: boolean) => Promise<any>;
  isCacheValid: (key: string, ttl?: number) => boolean;
}

// Module-level variable to store pending config promise for deduplication
let pendingConfigPromise: Promise<any> | null = null;

export const useSystemStore = create<SystemState>((set, get) => ({
  teachers: [],
  madrasahInfo: null,
  systemStats: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastFetched: {
    teachers: null,
    madrasahInfo: null,
    systemStats: null,
    systemConfig: null,
  },
  systemConfig: null,
  isConfigLoading: false,

  setIsOnline: (isOnline) => set({ isOnline }),

  isCacheValid: (key, ttl = 24 * 60 * 60 * 1000) => {
    const last = (get().lastFetched as any)[key];
    if (!last) return false;
    return Date.now() - last < ttl;
  },

  fetchSystemConfig: async (force = false) => {
    // 1 hour TTL for system config
    const CONFIG_TTL = 60 * 60 * 1000;
    if (!force && get().isCacheValid('systemConfig', CONFIG_TTL) && get().systemConfig) {
      return get().systemConfig;
    }

    if (pendingConfigPromise) {
      return pendingConfigPromise;
    }

    pendingConfigPromise = (async () => {
      set({ isConfigLoading: true });

      try {
        const data = await getSystemConfigWithCache('config');
        if (data) {
          const config = {
            masterVersion: data.master_version || 1,
            featureLocks: data.feature_locks || data.locked || [],
            rolePermissions: data.role_permissions || {},
            emergencyAlert: data.emergency_alert || data.active_alert || null,
            maintenanceMode: data.maintenance_mode || false,
            lastUpdated: data.last_updated || '',
          };
          set({ 
            systemConfig: config, 
            lastFetched: { ...get().lastFetched, systemConfig: Date.now() } 
          });

          // Sync with other stores if needed (Architecture Compliant)
          try {
            const uiStore = useUIStore.getState();
            
            if (config.masterVersion) {
              if (useStudentStore.getState().setMasterVersion) {
                useStudentStore.getState().setMasterVersion(config.masterVersion);
              }
              if ((uiStore as any).setMasterVersion) {
                (uiStore as any).setMasterVersion(config.masterVersion);
              }
            }

            if (config.featureLocks) {
              uiStore.setLockedFeatures(config.featureLocks);
            }

            if (config.rolePermissions) {
              uiStore.setRolePermissions(config.rolePermissions);
            }
          } catch (err) {
            console.warn('[SystemStore] Failed to sync system config to other stores:', err);
          }

          return config;
        }
      } catch (e) {
        console.warn('Failed to fetch system config:', e);
      } finally {
        set({ isConfigLoading: false });
        pendingConfigPromise = null;
      }
      return get().systemConfig;
    })();

    return pendingConfigPromise;
  },

  fetchTeachers: async (force = false) => {
    if (!force && get().isCacheValid('teachers') && get().teachers.length > 0)
      return get().teachers;
    if ((get() as any)._fetching_teachers) return get().teachers;
    (get() as any)._fetching_teachers = true;

    try {
      const teachers = await fetchTeachersFromService();
      set({ teachers, lastFetched: { ...get().lastFetched, teachers: Date.now() } });
      (get() as any)._fetching_teachers = false;
      return teachers;
    } catch (error) {
      (get() as any)._fetching_teachers = false;
      return get().teachers;
    }
  },

  fetchMadrasahInfo: async (force = false) => {
    if (!force && get().isCacheValid('madrasahInfo') && get().madrasahInfo)
      return get().madrasahInfo;

    try {
      const data = await getMadrasahInfo();
      if (data) {
        set({ madrasahInfo: data, lastFetched: { ...get().lastFetched, madrasahInfo: Date.now() } });
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch madrasah info:', e);
    }
    return get().madrasahInfo;
  },

  fetchSystemStats: async (force = false) => {
    const STATS_TTL = 30 * 60 * 1000;
    if (!force && get().isCacheValid('systemStats', STATS_TTL) && get().systemStats)
      return get().systemStats;

    try {
      const data = await getDashboardSummary();
      if (data) {
        set({ systemStats: data, lastFetched: { ...get().lastFetched, systemStats: Date.now() } });
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch system stats:', e);
    }
    return get().systemStats;
  },
}));

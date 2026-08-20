import { create } from 'zustand';

export type AppState =
  | 'initializing'
  | 'ready'
  | 'loading'
  | 'error'
  | 'maintenance'
  | 'self-healing';

interface AppStoreState {
  // Primary States
  currentState: AppState;
  isInitializing: boolean;
  isReady: boolean;
  isLoading: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  isSelfHealing: boolean;
  isMaintenanceMode: boolean;

  // Error Flags
  hasDatabaseError: boolean;
  hasSyncError: boolean;
  hasSchemaError: boolean;
  globalError: string | null;
  errorDetails: any | null;

  // Meta
  lastRecoveryTime: number | null;
  initializationLog: string[];

  // Actions
  setGlobalError: (error: string | null, details?: any) => void;
  clearGlobalError: () => void;
  enterSelfHealing: () => void;
  exitSelfHealing: (success: boolean) => void;
  enterMaintenanceMode: (reason: string) => void;
  exitMaintenanceMode: () => void;
  setInitializationState: (state: AppState) => void;
  addLog: (message: string) => void;
  updateConnectivity: (isOffline: boolean) => void;
  setSyncStatus: (isSyncing: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set) => {
  const appendLog = (state: AppStoreState, message: string) => [
    ...state.initializationLog,
    `[${new Date().toLocaleTimeString()}] ${message}`,
  ];

  const addLog = (message: string) =>
    set((state) => ({
      initializationLog: appendLog(state, message),
    }));

  return {
    currentState: 'initializing',
    isInitializing: true,
    isReady: false,
    isLoading: false,
    isOffline:
      typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false,
    isSyncing: false,
    isSelfHealing: false,
    isMaintenanceMode: false,

    hasDatabaseError: false,
    hasSyncError: false,
    hasSchemaError: false,
    globalError: null,
    errorDetails: null,

    lastRecoveryTime: null,
    initializationLog: [],

    setGlobalError: (error, details) =>
      set({
        globalError: error,
        errorDetails: details,
        currentState: error ? 'error' : details?.maintenance ? 'maintenance' : 'ready',
      }),

    clearGlobalError: () =>
      set({
        globalError: null,
        errorDetails: null,
        currentState: 'ready',
      }),

    enterSelfHealing: () =>
      set((state) => ({
        isSelfHealing: true,
        currentState: 'self-healing',
        initializationLog: appendLog(state, '[Self-Healing] Started'),
      })),

    exitSelfHealing: (success) =>
      set((state) => ({
        isSelfHealing: false,
        currentState: success ? 'ready' : 'maintenance',
        lastRecoveryTime: success ? Date.now() : state.lastRecoveryTime,
        initializationLog: appendLog(state, `[Self-Healing] ${success ? 'Success' : 'Failed'}`),
      })),

    enterMaintenanceMode: (reason) =>
      set({
        isMaintenanceMode: true,
        currentState: 'maintenance',
        globalError: reason,
      }),

    exitMaintenanceMode: () =>
      set({
        isMaintenanceMode: false,
        currentState: 'ready',
        globalError: null,
      }),

    setInitializationState: (state) =>
      set({
        currentState: state,
        isInitializing: state === 'initializing',
        isReady: state === 'ready',
      }),

    addLog,

    updateConnectivity: (isOffline) => set({ isOffline }),

    setSyncStatus: (isSyncing) => set({ isSyncing }),
  };
});

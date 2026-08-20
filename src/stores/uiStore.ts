import { create } from 'zustand';
import { sanitizeError } from '../utils/firestoreHelpers';
import { ViewState } from '@/types';

export type ColorTheme = 'classic-blue' | 'emerald-forest' | 'midnight-slate';

interface UIState {
  isChatActive: boolean;
  isDarkMode: boolean;
  colorTheme: ColorTheme;
  currentView: ViewState;
  currentCollection: string | null;
  navigationHistory: ViewState[];
  lockedFeatures: string[];
  devConsoleActiveTab: string;
  autoFixStatus: {
    isFixing: boolean;
    lastFix: string | null;
    message: string | null;
    error?: string | null;
  };
  rolePermissions: Record<string, string[]>;
  activeWorkspace: 'developer' | 'tenant';
  toggleTheme: () => void;
  setColorTheme: (theme: ColorTheme) => void;
  setIsChatActive: (active: boolean) => void;
  setCurrentView: (view: ViewState) => void;
  setCurrentCollection: (collection: string | null) => void;
  navigateToCollection: (collection: string) => void;
  setNavigationHistory: (history: ViewState[] | ((prev: ViewState[]) => ViewState[])) => void;
  setRolePermissions: (perms: Record<string, string[]>) => void;
  setLockedFeatures: (features: string[]) => void;
  setDevConsoleActiveTab: (tab: string) => void;
  setAutoFixStatus: (status: Partial<UIState['autoFixStatus']>) => void;
  setActiveWorkspace: (workspace: 'developer' | 'tenant') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: (() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      if (window.matchMedia) return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {}
    return false;
  })(),
  colorTheme: (() => {
    if (typeof window === 'undefined') return 'classic-blue';
    try {
      const saved = localStorage.getItem('app_color_theme') as ColorTheme;
      if (saved === 'classic-blue' || saved === 'emerald-forest' || saved === 'midnight-slate') {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-color-theme', saved);
        }
        return saved;
      }
    } catch (_) {}
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-color-theme', 'classic-blue');
    }
    return 'classic-blue';
  })(),
  isChatActive: false,
  currentView: (() => {
    if (typeof window === 'undefined') return ViewState.LOGIN;
    try {
      if (localStorage.getItem('emam_user_session')) {
        return ViewState.DASHBOARD;
      }
    } catch (_) {}
    return ViewState.LOGIN;
  })(),
  currentCollection: null,
  navigationHistory: [],
  lockedFeatures: [],
  devConsoleActiveTab: 'overview',
  autoFixStatus: {
    isFixing: false,
    lastFix: null,
    message: null,
    error: null,
  },
  rolePermissions: {},
  activeWorkspace: 'tenant',
  toggleTheme: () =>
    set((state) => {
      const isDark = !state.isDarkMode;
      try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      } catch (e) {}
      return { isDarkMode: isDark };
    }),
  setColorTheme: (colorTheme) =>
    set(() => {
      try {
        localStorage.setItem('app_color_theme', colorTheme);
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-color-theme', colorTheme);
        }
      } catch (e) {}
      return { colorTheme };
    }),
  setIsChatActive: (isChatActive) => set({ isChatActive }),
  setCurrentView: (currentView) => set({ currentView }),
  setCurrentCollection: (currentCollection) => set({ currentCollection }),
  navigateToCollection: (collection) =>
    set((state) => {
      const history = [...state.navigationHistory];
      if (state.currentView !== ViewState.LOGIN) {
        history.push(state.currentView);
      }
      return {
        currentView: ViewState.COLLECTION_EXPLORER,
        currentCollection: collection,
        navigationHistory: history,
      };
    }),
  setNavigationHistory: (history) =>
    set((state) => ({
      navigationHistory: typeof history === 'function' ? history(state.navigationHistory) : history,
    })),
  setRolePermissions: (rolePermissions) => set({ rolePermissions }),
  setLockedFeatures: (lockedFeatures) => set({ lockedFeatures }),
  setDevConsoleActiveTab: (tab) => set({ devConsoleActiveTab: tab }),
  setAutoFixStatus: (status) =>
    set((state) => {
      const newStatus: any = { ...status };
      if (newStatus.error) {
        newStatus.error = sanitizeError(newStatus.error);
      }
      return {
        autoFixStatus: { ...state.autoFixStatus, ...newStatus },
      };
    }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
}));

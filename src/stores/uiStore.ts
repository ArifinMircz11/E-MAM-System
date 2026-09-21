import { create } from 'zustand';
export const useUIStore = create(() => ({
  currentView: 'LOGIN',
  lockedFeatures: [],
  navigationHistory: [],
  isDarkMode: false,
  autoFixStatus: { isFixing: false },
  setCurrentView: () => {},
  setNavigationHistory: () => {},
  toggleTheme: () => {},
  setAutoFixStatus: () => {},
  setLockedFeatures: () => {},
  setRolePermissions: () => {},
  setActiveWorkspace: () => {},
  colorTheme: 'classic-blue',
  setColorTheme: () => {},
}));

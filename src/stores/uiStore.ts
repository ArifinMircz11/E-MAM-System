import { create } from 'zustand';
import { ViewState } from '../types';
export const useUIStore = create((set: any) => ({
  currentView: ViewState.LOGIN,
  lockedFeatures: [],
  navigationHistory: [],
  isDarkMode: false,
  autoFixStatus: { isFixing: false },
  setCurrentView: (view: any) => set({ currentView: view }),
  setNavigationHistory: (history: any) => set((state: any) => ({ navigationHistory: typeof history === 'function' ? history(state.navigationHistory) : history })),
  toggleTheme: () => set((state: any) => ({ isDarkMode: !state.isDarkMode }))
}));

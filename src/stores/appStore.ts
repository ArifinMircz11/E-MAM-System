import { create } from 'zustand';
export const useAppStore = create(() => ({
  currentState: 'ready',
  initializationLog: [],
  globalError: null
}));

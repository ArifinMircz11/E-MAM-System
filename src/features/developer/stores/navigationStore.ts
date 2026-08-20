import { create } from 'zustand';
import { DeveloperTabKey } from '../types/DeveloperTab';

interface NavigationState {
  currentTab: DeveloperTabKey;
  previousTab: DeveloperTabKey | null;
  history: DeveloperTabKey[];

  navigateToTab: (tab: DeveloperTabKey) => void;
  goBack: () => void;
}

export const useDeveloperNavigationStore = create<NavigationState>((set, get) => ({
  currentTab: 'overview',
  previousTab: null,
  history: ['overview'],

  navigateToTab: (tab) => {
    const { currentTab, history } = get();
    if (currentTab === tab) return;
    set({
      currentTab: tab,
      previousTab: currentTab,
      history: [...history, tab],
    });
  },

  goBack: () => {
    const { history } = get();
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const prev = newHistory[newHistory.length - 1];
    set({
      currentTab: prev,
      previousTab: history[history.length - 1],
      history: newHistory,
    });
  },
}));

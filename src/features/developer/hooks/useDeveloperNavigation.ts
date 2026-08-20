import { useDeveloperNavigationStore } from '../stores/navigationStore';
import { DeveloperTabKey } from '../types/DeveloperTab';

export const useDeveloperNavigation = () => {
  const { currentTab, previousTab, history, navigateToTab, goBack } = useDeveloperNavigationStore();

  return {
    currentTab,
    previousTab,
    history,
    navigateToTab: (tab: DeveloperTabKey) => navigateToTab(tab),
    goBack,
  };
};

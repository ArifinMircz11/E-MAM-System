import { DeveloperTabKey } from '../types/DeveloperTab';
import { DEVELOPER_TABS } from '../constants/tabs';

export class NavigationService {
  isValidTab(tabKey: string): tabKey is DeveloperTabKey {
    return DEVELOPER_TABS.some((t) => t.id === tabKey);
  }

  getTabDetails(tabKey: DeveloperTabKey) {
    return DEVELOPER_TABS.find((t) => t.id === tabKey) || DEVELOPER_TABS[0];
  }
}

export const navigationService = new NavigationService();

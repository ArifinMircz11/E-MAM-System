import { ViewState } from '@/types';
import { DeveloperTabKey } from './DeveloperTab';

export interface NavigationMenuItem {
  id: DeveloperTabKey;
  viewState?: ViewState;
  label: string;
  iconName: string;
  category: string;
  badge?: string;
  permission?: string;
  roles?: string[];
}

export interface NavigationMenuGroup {
  title: string;
  items: NavigationMenuItem[];
}

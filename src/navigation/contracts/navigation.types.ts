import type { NavigationAccessRule } from './navigation.permission';

export interface NavigationNode {
  id: string;
  title: string;
  path: string;
  icon?: string;
  access?: NavigationAccessRule;
  featureFlag?: string;
  tenantRequired?: boolean;
  children?: NavigationNode[];
  order?: number;
  section?: string;
}

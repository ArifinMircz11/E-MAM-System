export interface NavigationModule {
  id: string;
  name: string;
  route: string;
  version: string;
  loader: () => Promise<any>;
  preload?: boolean;
  permissions: string[];
  enabled: boolean;
}

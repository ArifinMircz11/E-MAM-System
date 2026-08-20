import { GLOBAL_NAVIGATION_REGISTRY } from '../registries/globalNavigationRegistry';

export interface Breadcrumb {
  title: string;
  path: string;
}

export class BreadcrumbService {
  static resolve(pathname: string): Breadcrumb[] {
    const items = pathname.split('/').filter(Boolean);

    return items.map((item, index) => {
      const currentPath = '/' + items.slice(0, index + 1).join('/');
      
      // Find matching registry item to get human-readable title
      const registryItem = GLOBAL_NAVIGATION_REGISTRY.find(node => '/' + node.path === currentPath);
      
      return {
        title: registryItem ? registryItem.title : item.replace(/-/g, ' ').toUpperCase(),
        path: currentPath
      };
    });
  }
}

import { localDb } from '@/database/dexie';

export interface NavigationCache {
  id: string; // usually 'global' or tenantId
  organizationId: string;
  version: number;
  syncedAt: number;
  data: any; // The serialized registry if needed
}

export class NavigationCacheRepository {
  private table = localDb.table<NavigationCache>('navigation_cache');

  async getCache(id: string): Promise<NavigationCache | null> {
    const cache = await this.table.get(id);
    return cache || null;
  }

  async saveCache(cache: NavigationCache): Promise<void> {
    await this.table.put(cache);
  }

  async clearCache(id: string): Promise<void> {
    await this.table.delete(id);
  }
}

export const navigationCacheRepository = new NavigationCacheRepository();

/**
 * In-memory / fast cache service for hot data
 */
export class CacheService {
  private static cache = new Map<string, { value: any; expiry: number }>();

  static async getCachedData<T>(collection: string, tenantId: string): Promise<T[]> {
    return [];
  }

  static async invalidateCache(collection: string, tenantId: string): Promise<void> {}

  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  static set<T>(key: string, value: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  static delete(key: string): void {
    this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }
}

export const cacheService = CacheService;

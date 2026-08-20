import { localDb } from '@/database/dexie';
import type { SecurityContext } from '@/core/security/types';

export interface AppSetting {
  key: string;
  tenantId: string;
  value: any;
  updatedAt: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

const cache = new Map<string, { record: AppSetting | null; timestamp: number }>();
const pendingPromises = new Map<string, Promise<AppSetting | null>>();
const CACHE_TTL = 10000; // 10 seconds memory TTL

export const SettingsRepository = {
  async get(context: SecurityContext, key: string): Promise<AppSetting | null> {
    const tenantId = context.tenantId;
    const cacheKey = `${tenantId || 'global'}:${key}`;

    const stack = new Error().stack || '';
    const callerLine = stack.split('\n')[2] || '';
    console.log(`[SettingsRepository] Fetching setting ${key}. Caller: ${callerLine.trim()}`);
    if (key === 'config' || key === 'app_version') {
      console.trace(`[SettingsRepository] Trace for fetching ${key}`);
    }

    // Check if cache is still valid
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`[SettingsRepository] Cache hit for setting ${key}`);
      return cached.record;
    }

    // Check if there is an active pending query promise
    let promise = pendingPromises.get(cacheKey);
    if (promise) {
      console.log(`[SettingsRepository] Deduplicating fetch promise for setting ${key}`);
      return promise;
    }

    promise = (async () => {
      try {
        if (key === 'config') {
          console.count("Repository config");
        } else if (key === 'app_version') {
          console.count("Repository app_version");
        }

        // Try to find by composite key if possible, or just filter
        const record = await localDb.settings
          .where('key')
          .equals(key)
          .and(item => item.tenantId === tenantId)
          .first();
        
        const result = record || null;
        cache.set(cacheKey, { record: result, timestamp: Date.now() });
        return result;
      } catch (e) {
        console.error(`[SettingsRepository] Error fetching setting ${key}:`, e);
        return null;
      } finally {
        pendingPromises.delete(cacheKey);
      }
    })();

    pendingPromises.set(cacheKey, promise);
    return promise;
  },

  async getAll(context: SecurityContext): Promise<AppSetting[]> {
    try {
      const tenantId = context.tenantId;

      return await localDb.settings
        .where('tenantId')
        .equals(tenantId)
        .toArray();
    } catch (e) {
      console.error('[SettingsRepository] Error fetching all settings:', e);
      return [];
    }
  },

  async save(context: SecurityContext, key: string, value: any, merge: boolean = true): Promise<void> {
    const tenantId = context.tenantId;
    const userId = context.uid;
    if (!tenantId) throw new Error('Tenant ID is required to save settings');

    const cacheKey = `${tenantId}:${key}`;
    cache.delete(cacheKey);
    pendingPromises.delete(cacheKey);

    const now = new Date().toISOString();
    
    let finalValue = value;
    if (merge) {
      const existing = await this.get(context, key);
      if (existing) {
        finalValue = { ...existing.value, ...value };
      }
    }

    const setting: AppSetting = {
      key,
      tenantId,
      value: finalValue,
      updatedAt: now,
      syncStatus: 'pending'
    };

    // 1. Save to Dexie
    await localDb.settings.put(setting);
    
    // Cache the updated setting
    cache.set(cacheKey, { record: setting, timestamp: Date.now() });

    // 2. Add to Sync Queue
    await localDb.sync_queue.add({
      id: crypto.randomUUID(),
      tenantId,
      collection: 'settings',
      documentId: key,
      operation: 'update',
      payload: {
        ...finalValue,
        updatedAt: now,
        updatedBy: userId,
        tenantId
      },
      status: 'pending',
      priority: 1,
      createdAt: now,
      retryCount: 0,
      deviceId: (context as any).deviceId || 'unknown'
    });
  }
};

import { localDb } from '@/database/dexie';
import type { SecurityContext } from '@/core/security/types';
import { syncRepository } from '@/repositories/SyncRepository';

export interface AppSetting {
  key: string;
  tenantId: string;
  value: any;
  updatedAt: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

const cache = new Map<string, { record: AppSetting | null; timestamp: number }>();
const pendingPromises = new Map<string, Promise<AppSetting | null>>();
const CACHE_TTL = 10000;

export const SettingsRepository = {
  async get(context: SecurityContext, key: string): Promise<AppSetting | null> {
    const tenantId = context.tenantId;
    const cacheKey = `${tenantId || 'global'}:${key}`;
    const stack = new Error().stack || '';
    const callerLine = stack.split('\n')[2] || '';
    console.log(`[SettingsRepository] Fetching setting ${key}. Caller: ${callerLine.trim()}`);
    if (key === 'config' || key === 'app_version') console.trace(`[SettingsRepository] Trace for fetching ${key}`);

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.record;
    const pending = pendingPromises.get(cacheKey);
    if (pending) return pending;

    const request = (async () => {
      const record = await localDb.settings.where('[tenantId+key]').equals([tenantId, key]).first();
      const normalized = record ? {
        key,
        tenantId,
        value: record.value,
        updatedAt: String(record.updatedAt ?? new Date(0).toISOString()),
        syncStatus: record.syncStatus,
      } : null;
      cache.set(cacheKey, { record: normalized, timestamp: Date.now() });
      return normalized;
    })();

    pendingPromises.set(cacheKey, request);
    try { return await request; } finally { pendingPromises.delete(cacheKey); }
  },

  async set(context: SecurityContext, key: string, value: any, userId: string): Promise<void> {
    const tenantId = context.tenantId;
    if (!tenantId) throw new Error('SETTINGS_TENANT_REQUIRED');
    const now = new Date().toISOString();
    const finalValue = value && typeof value === 'object' ? value : { value };

    await localDb.settings.put({
      id: `${tenantId}:${key}`,
      key,
      tenantId,
      value: finalValue,
      updatedAt: now,
      updatedBy: userId,
      syncStatus: 'pending',
    });

    cache.set(`${tenantId}:${key}`, {
      record: { key, tenantId, value: finalValue, updatedAt: now, syncStatus: 'pending' },
      timestamp: Date.now(),
    });

    const payload = { ...finalValue, updatedAt: now, updatedBy: userId, tenantId };
    await syncRepository.enqueue({
      tenantId,
      collection: 'settings',
      recordId: key,
      operation: 'update',
      payload,
    }, context);
  },
};

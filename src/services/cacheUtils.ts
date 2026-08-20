/**
 * e-Mam System - Cache Wrapper
 */
import { localDb } from '@/database/dexie';
import { sanitizeForJSON } from '@/utils/firestoreHelpers';

export const CACHE_TTL = {
  HISTORIS: 3600000,
  ATTENDANCE_HISTORY: 3600000,
  MASTER: 600000,
  CLASS: 600000,
  STUDENT_MASTER: 600000,
  TEACHER_MASTER: 600000,
  OPERASIONAL: 120000,
  BK_POINTS: 120000,
  LETTERS: 120000,
  APPROVALS: 120000,
  default: 86400000,
} as const;

export async function initDB() {
  return localDb;
}

export async function getCachedOrFetch<T>(
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cachedData = await getCacheIfValid<T>(cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }

  const freshData = await fetchFn();

  if (freshData !== undefined && freshData !== null) {
    await setCacheWithTTL(cacheKey, freshData, ttl);
  }

  return freshData;
}

export async function setCacheWithTTL(key: string, data: any, ttl: number = CACHE_TTL.default) {
  try {
    await localDb.cache.put({
      key,
      data: sanitizeForJSON(data),
      updatedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  } catch (error) {
    console.error(`[Cache] Failed to set ${key}:`, error);
  }
}

export async function getCacheIfValid<T>(key: string): Promise<T | null> {
  try {
    const item = await localDb.cache.get(key);

    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      await localDb.cache.delete(key);
      return null;
    }

    return item.data as T;
  } catch (error) {
    return null;
  }
}

export async function clearExpiredCache() {
  try {
    const now = Date.now();
    const expiredItems = await localDb.cache
      .filter((item) => item.expiresAt !== undefined && item.expiresAt < now)
      .toArray();

    for (const item of expiredItems) {
      await localDb.cache.delete(item.key);
    }
    return expiredItems.length;
  } catch (error) {
    return 0;
  }
}

export async function getCacheSize(): Promise<number> {
  try {
    const items = await localDb.cache.toArray();
    let size = 0;
    for (const item of items) {
      try {
        size += JSON.stringify(item).length;
      } catch (e) {
        size += 100;
      }
    }
    return size;
  } catch (error) {
    return 0;
  }
}

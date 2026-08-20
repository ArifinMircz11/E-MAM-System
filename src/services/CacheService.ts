/**
 * @license
 * e-Mam System - Cache Service
 * LAYER: SERVICE (Local-First Offline-First SSOT via Dexie)
 */

import { localDb } from '@/database/dexie';

export interface CacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
  tenantId?: string;
}

const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes default TTL

class CacheServiceClass {
  private getTableForCollection(collectionName: string): any {
    switch (collectionName) {
      case 'students':
        return localDb.students;
      case 'teachers':
        return localDb.teachers;
      case 'classes':
        return localDb.classes;
      case 'point_categories':
      case 'pointCategories':
        return localDb.pointCategories;
      case 'poin':
      case 'points':
        return localDb.poin;
      case 'attendance':
        return localDb.attendance;
      case 'letters':
        return localDb.letters;
      case 'academic_years':
      case 'academicYears':
        return localDb.academicYears;
      case 'schedules':
        return localDb.schedules;
      case 'documentation':
        return localDb.documentation;
      case 'journals':
        return localDb.journals;
      case 'student_point_summaries':
        return localDb.student_point_summaries;
      case 'point_rankings':
        return localDb.pointRankings;
      case 'login_history':
        return localDb.loginHistory;
      case 'notification_logs':
        return localDb.notificationLogs;
      case 'teacher_attendance':
        return localDb.teacher_attendance;
      case 'users':
        return localDb.users;
      case 'news':
        return localDb.news;
      case 'chats':
        return localDb.chats;
      case 'messages':
        return localDb.messages;
      case 'audit_logs':
        return localDb.audit_logs;
      case 'dashboard_summaries':
        return localDb.dashboard_summaries;
      default:
        return (localDb as any)[collectionName] || null;
    }
  }

  async getCollection<T>(
    collectionName: string,
    _tableName: any,
    idField: string = 'id',
    options: CacheOptions = {},
  ): Promise<T[]> {
    const table = this.getTableForCollection(collectionName);
    if (!table) return [];

    try {
      const localData = await table.toArray();
      if (!localData || localData.length === 0) return [];

      let filtered = localData;
      if (options.tenantId && options.tenantId !== 'developer') {
        filtered = localData.filter(
          (item: any) =>
            item.tenantId === options.tenantId ||
            (item.sistemJangkar && item.sistemJangkar.tenantId === options.tenantId),
        );
      }
      return filtered as unknown as T[];
    } catch (e) {
      console.warn(`[CacheService] Failed to load local collection ${collectionName}:`, e);
      return [];
    }
  }

  async refreshCollection<T>(
    collectionName: string,
    idField: string = 'id',
    options: CacheOptions = {},
  ): Promise<T[]> {
    return this.getCollection<T>(collectionName, null, idField, options);
  }

  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    const table = this.getTableForCollection(collectionName);
    if (!table) return null;
    try {
      return (await table.get(docId)) || null;
    } catch (e) {
      console.warn(`[CacheService] Failed to get document ${docId} from ${collectionName}:`, e);
      return null;
    }
  }

  async getCachedData<T>(collectionName: string, tenantId?: string): Promise<T[]> {
    return this.getCollection<T>(collectionName, null, 'id', { tenantId });
  }

  async saveToCache<T>(collectionName: string, data: T | T[], _tenantId?: string): Promise<any> {
    const table = this.getTableForCollection(collectionName);
    if (!table) return Promise.resolve();
    if (Array.isArray(data)) {
      return table.bulkPut(data);
    }
    return table.put(data);
  }

  async clearAll(): Promise<void> {
    try {
      await localDb.delete();
      await localDb.open();
    } catch (e) {
      console.warn('[CacheService] clearAll failed:', e);
    }
  }

  async invalidateCache(collectionName: string, tenantId?: string): Promise<void> {
    const cacheKey = `collection_${collectionName}_${tenantId || 'global'}`;
    try {
      await localDb.cache.delete(cacheKey);
    } catch (e) {
      console.warn(`[CacheService] Failed to invalidate cache for ${collectionName}:`, e);
    }
  }
}

export const CacheService = new CacheServiceClass();

/**
 * @license
 * e-Mam System - News Repository
 * LAYER: REPOSITORY (Dexie Only Access - Architecture Compliant)
 */

import { BaseRepository } from './base/BaseRepository';
import type { NewsItem } from '@/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

export class NewsRepository extends BaseRepository<NewsItem> {
  constructor() {
    super('news');
  }

  /**
   * Get news articles using local-first cache (Dexie)
   */
  async getNews(tenantId: string, onlyPublished = true): Promise<NewsItem[]> {
    try {
      const items = await this.table.where('tenantId').equals(tenantId).toArray();

      const sorted = [...items].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return onlyPublished ? sorted.filter((n) => n.isPublished) : sorted;
    } catch (error) {
      console.error('[NewsRepository] Fetch failure:', error);
      return [];
    }
  }

  /**
   * Save news (create or update)
   */
  async saveNews(news: Partial<NewsItem>, tenantId: string): Promise<string> {
    const id = news.id || `NEWS_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const finalData: NewsItem = {
      ...news,
      id,
      tenantId,
      updatedAt: now,
      createdAt: news.createdAt || now,
      date: news.date || new Date().toISOString().split('T')[0],
      syncStatus: 'pending' as any,
    } as NewsItem;

    try {
      const dbInstance = (this.table as any).db || localDb;
      await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
        await this.table.put(finalData);
        await syncRepository.enqueue({
          tenantId,
          collection: 'news',
          action: 'UPDATE',
          payload: finalData,
        }, undefined, { triggerSync: false, db: dbInstance });
      });
      (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
      return id;
    } catch (error) {
      console.error('[NewsRepository] Save failure:', error);
      throw error;
    }
  }

  async deleteNews(id: string): Promise<void> {
    try {
      const existing = await this.table.get(id);
      const tenantId = existing?.tenantId || 'global';

      const dbInstance = (this.table as any).db || localDb;
      await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
        await this.table.delete(id);
        await syncRepository.enqueue({
          tenantId,
          collection: 'news',
          action: 'DELETE',
          payload: { id },
        }, undefined, { triggerSync: false, db: dbInstance });
      });
      (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
    } catch (error) {
      console.error('[NewsRepository] Delete failure:', error);
      throw error;
    }
  }
}

export const newsRepository = new NewsRepository();


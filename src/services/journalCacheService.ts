/**
 * @license
 * e-Mam System - Journal Service
 * LAYER: SERVICE LAYER (Architecture Compliant)
 */

import { journalRepository } from '@/repositories/journalRepository';
import { syncRepository } from '@/repositories/SyncRepository';

const COLLECTION_NAME = 'journals';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class JournalCacheService {
  static async getJournals(tenantId: string, limitCount: number = 50, forceRefresh = false) {
    // 1. Repository (Dexie) Layer
    const cached = await journalRepository.getByTenant(tenantId);

    const now = Date.now();
    const isFresh = cached.length > 0 && now - (cached[0]?.updatedAt || 0) < CACHE_TTL;

    if (!forceRefresh && isFresh) {
      return cached.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    // 2. Firestore Layer via Repository
    try {
      const results = await journalRepository.fetchByTenant(tenantId, limitCount * 2);

      const freshData = (results || []).map((d) => ({
        ...d,
        updatedAt: now,
      }));

      freshData.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const limitedData = freshData.slice(0, limitCount);

      // 3. Update Repository
      if (limitedData.length > 0) {
        for (const item of limitedData) {
          await journalRepository.update(item as any);
        }
      }

      return limitedData;
    } catch (error) {
      if (cached.length > 0) {
        return cached.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      }
      throw error;
    }
  }

  static async saveJournal(journal: any) {
    const tenantId = journal.tenantId;
    if (!tenantId) throw new Error('tenantId required');

    // 1. Update Repository
    await journalRepository.update({
      ...journal,
      updatedAt: Date.now(),
    });

    // 2. Enqueue Sync
    await syncRepository.enqueue({
      tenantId,
      action: 'CREATE',
      collection: COLLECTION_NAME as any,
      payload: journal,
    } as any);
  }

  static async invalidateCache(tenantId: string) {
    await journalRepository.clearTenantCache(tenantId);
  }

  static async putJournal(journal: any) {
    await journalRepository.update({
      ...journal,
      updatedAt: Date.now(),
    });
  }
}

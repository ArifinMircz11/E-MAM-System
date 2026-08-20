import { BaseRepository } from './base/BaseRepository';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import type { SecurityContext } from '@/core/security/types';
import type { AppEntity } from '@/domain/entities/base';

export interface KonselingRecord extends AppEntity {
  id: string;
  tenantId: string;
  studentId: string;
  studentName?: string;
  counselorId: string;
  counselorName?: string;
  date: string;
  issue: string;
  notes: string;
  actionTaken: string;
  status: 'open' | 'follow_up' | 'resolved';
  version: number;
}

export class BkRepository extends BaseRepository<KonselingRecord> {
  constructor() {
    super('konseling');
  }

  async getKonselingByTenant(context: SecurityContext, tenantId: string): Promise<KonselingRecord[]> {
    this.validateContext(context, 'getKonselingByTenant');
    const target = context.isDeveloper ? tenantId : context.tenantId;
    return await this.table.where('tenantId').equals(target).toArray();
  }

  async createKonseling(context: SecurityContext, record: KonselingRecord): Promise<void> {
    this.validateContext(context, 'createKonseling');
    const dataToSave = {
      ...record,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
      createdAt: record.createdAt || Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'konseling',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: record.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async updateKonseling(context: SecurityContext, id: string, updates: Partial<KonselingRecord>): Promise<void> {
    this.validateContext(context, 'updateKonseling');
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      const existing = await this.table.get(id);
      if (!existing) throw new Error('Konseling record not found');

      const finalData = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
        version: (existing.version || 1) + 1,
        syncStatus: 'pending' as any,
      };

      await this.table.put(finalData);
      await syncRepository.enqueue({
        collection: 'konseling',
        action: 'UPDATE',
        payload: finalData,
        tenantId: existing.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }
}

export const bkRepository = new BkRepository();

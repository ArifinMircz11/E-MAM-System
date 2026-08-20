import { BaseRepository } from './base/BaseRepository';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import { SecurityContext } from '@/core/security/types';

export interface PelayananRecord {
  id: string;
  tenantId: string;
  trackingNumber: string;
  applicantId: string;
  applicantName: string;
  serviceType: string;
  subject: string;
  description: string;
  status: 'pending' | 'verified' | 'processing' | 'completed' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string | number;
  version: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  deleted?: boolean;
}

/**
 * PtspRepository
 *
 * SSOT for the 'pelayanan' table in Dexie.
 */
export class PtspRepository extends BaseRepository<any> {
  constructor() {
    super('pelayanan');
  }

  async getPelayananByTenant(context: SecurityContext, tenantId: string): Promise<PelayananRecord[]> {
    this.validateContext(context, 'getPelayananByTenant');
    const target = context.isDeveloper ? tenantId : context.tenantId;
    return await this.table.where('tenantId').equals(target).toArray();
  }

  async createPelayanan(context: SecurityContext, record: PelayananRecord): Promise<void> {
    this.validateContext(context, 'createPelayanan');
    const dataToSave = {
      ...record,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'pelayanan',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: record.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async updatePelayananStatus(context: SecurityContext, id: string, status: PelayananRecord['status'], notes?: string): Promise<void> {
    this.validateContext(context, 'updatePelayananStatus');
    const existing = await this.table.get(id);
    if (existing) {
      const updated = {
        ...existing,
        status,
        notes: notes ?? existing.notes,
        updatedAt: Date.now(),
        version: (existing.version || 1) + 1,
        syncStatus: 'pending' as any,
      };

      const dbInstance = (this.table as any).db || localDb;
      await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
        await this.table.put(updated);
        await syncRepository.enqueue({
          collection: 'pelayanan',
          action: 'UPDATE',
          payload: updated,
          tenantId: existing.tenantId,
        }, undefined, { triggerSync: false, db: dbInstance });
      });
      (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
    }
  }
}

export const ptspRepository = new PtspRepository();

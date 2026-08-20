import { BaseRepository } from './base/BaseRepository';
import type { JournalEntry } from '@/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import { SyncStatus } from '@/domain/entities/base';

export class JournalRepository extends BaseRepository<JournalEntry> {
  constructor() {
    super('journals');
  }

  async findById(id: string, tenantId: string): Promise<JournalEntry | null> {
    return (await this.table.where('id').equals(id).filter(j => j.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<JournalEntry[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: JournalEntry): Promise<void> {
    const dbInstance = (this.table as unknown as { db: any }).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      const now = Date.now();
      const dataToSave = {
        ...entity,
        version: 1,
        syncStatus: SyncStatus.PENDING as SyncStatus,
        updatedAt: now,
      };

      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'journals',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
        metadata: {
          idempotencyKey: `journal/${entity.id}:create:v1`,
          version: 1,
        }
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: JournalEntry): Promise<void> {
    const dbInstance = (this.table as unknown as { db: any }).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      const existing = await this.table.where({ id: entity.id }).first();

      if (!existing) throw new Error("Journal record not found");
      if (existing.tenantId !== entity.tenantId) throw new Error("Tenant mismatch");

      const newVersion = (existing.version || 0) + 1;
      const now = Date.now();
      const dataToSave = {
        ...entity,
        version: newVersion,
        syncStatus: SyncStatus.PENDING as SyncStatus,
        updatedAt: now,
      };

      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'journals',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
        metadata: {
          idempotencyKey: `journal/${entity.id}:update:v${newVersion}`,
          version: newVersion,
        }
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(j => j.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'journals',
        action: 'DELETE',
        payload: { id },
        tenantId: tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getByTenant(tenantId: string, limitCount = 100): Promise<JournalEntry[]> {
    return await this.table.where('tenantId').equals(tenantId).limit(limitCount).toArray();
  }

  async fetchByTenant(tenantId: string, limitCount = 100): Promise<JournalEntry[]> {
    return this.getByTenant(tenantId, limitCount);
  }

  async clearTenantCache(tenantId: string) {
    await this.table.where('tenantId').equals(tenantId).delete();
  }
}

export const journalRepository = new JournalRepository();

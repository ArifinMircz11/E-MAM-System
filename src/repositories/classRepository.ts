import { BaseRepository } from './base/BaseRepository';
import type { Class } from '@/domain/entities/class';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

/**
 * ClassRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class ClassRepository extends BaseRepository<Class> {
  constructor() {
    super('classes');
  }

  async findById(id: string, tenantId: string): Promise<Class | null> {
    return (await this.table.where('id').equals(id).filter(c => c.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Class[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Class): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'classes',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Class): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'classes',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(c => c.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'classes',
        action: 'DELETE',
        payload: { id },
        tenantId: tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  // --- BUSINESS-SPECIFIC METHODS ---

  async fetchByTenant(arg1: any | string, arg2?: string): Promise<Class[]> {
    const tenantId = typeof arg1 === 'string' ? arg1 : arg2 || (arg1 as any)?.tenantId;
    return await this.findAll(tenantId);
  }

  async getByTenant(arg1: any | string, arg2?: string): Promise<Class[]> {
    return await this.fetchByTenant(arg1, arg2);
  }

  async findByClassId(tenantId: string, classId: string): Promise<Class | null> {
    return (
      (await this.table.where('[tenantId+classId]').equals([tenantId, classId]).first()) || null
    );
  }
}

export const classRepository = new ClassRepository();

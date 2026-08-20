import { BaseRepository } from './base/BaseRepository';
import type { Semester } from '@/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import type { SecurityContext } from '@/core/security/types';

export class SemesterRepository extends BaseRepository<Semester> {
  constructor() {
    super('semesters');
  }

  async findById(id: string, tenantId: string): Promise<Semester | null> {
    return (await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Semester[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Semester): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'semesters',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Semester): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'semesters',
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
      await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'semesters',
        action: 'DELETE',
        payload: { id },
        tenantId: tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic handled by SyncEngine
  }

  async fetchByTenant(context: SecurityContext, tenantId: string): Promise<Semester[]> {
    this.validateContext(context, 'fetchByTenant');
    return await this.findAll(tenantId);
  }
}

export const semesterRepository = new SemesterRepository();

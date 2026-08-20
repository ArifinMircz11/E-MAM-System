import { BaseRepository } from './base/BaseRepository';
import type { Schedule } from '@/domain/entities/schedule';
import type { SecurityContext } from '@/core/security/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

/**
 * ScheduleRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class ScheduleRepository extends BaseRepository<Schedule> {
  constructor() {
    super('schedules');
  }

  async findById(id: string, tenantId: string): Promise<Schedule | null> {
    return (await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Schedule[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Schedule): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'schedules',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Schedule): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'schedules',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'schedules',
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

  // --- BUSINESS-SPECIFIC METHODS ---

  async fetchByTenant(context: SecurityContext, tenantId: string): Promise<Schedule[]> {
    return await this.findAll(tenantId);
  }

  async findByClass(context: SecurityContext, tenantId: string, classId: string): Promise<Schedule[]> {
    return await this.table.where('[tenantId+classId]').equals([tenantId, classId]).toArray();
  }

  async findByTeacher(context: SecurityContext, tenantId: string, teacherId: string): Promise<Schedule[]> {
    return await this.table.where('[tenantId+teacherId]').equals([tenantId, teacherId]).toArray();
  }
}

export const scheduleRepository = new ScheduleRepository();

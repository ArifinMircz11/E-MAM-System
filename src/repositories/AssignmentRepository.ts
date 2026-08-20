import { BaseRepository } from './base/BaseRepository';
import type { Assignment } from '@/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

/**
 * AssignmentRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class AssignmentRepository extends BaseRepository<Assignment> {
  constructor() {
    super('assignments');
  }

  async findById(id: string, tenantId: string): Promise<Assignment | null> {
    return (await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Assignment[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Assignment): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'assignments',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Assignment): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'assignments',
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
      await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'assignments',
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

  async findByClass(tenantId: string, className: string): Promise<Assignment[]> {
    return await this.table
        .where('[tenantId+className]')
        .equals([tenantId, className])
        .toArray();
  }

  async findByTeacher(tenantId: string, teacherId: string): Promise<Assignment[]> {
    return await this.table
        .where('[tenantId+teacherId]')
        .equals([tenantId, teacherId])
        .toArray();
  }
}

export const assignmentRepository = new AssignmentRepository();

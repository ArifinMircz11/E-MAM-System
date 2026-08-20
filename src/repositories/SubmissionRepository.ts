import { BaseRepository } from './base/BaseRepository';
import type { Submission } from '@/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

export class SubmissionRepository extends BaseRepository<Submission> {
  constructor() {
    super('submissions');
  }

  async findById(id: string, tenantId: string): Promise<Submission | null> {
    return (await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Submission[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Submission): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'submissions',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Submission): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'submissions',
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
        collection: 'submissions',
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

  async findByAssignment(tenantId: string, assignmentId: string): Promise<Submission[]> {
    return await this.table.where({ tenantId, assignmentId }).toArray();
  }

  async findByStudent(tenantId: string, studentId: string): Promise<Submission[]> {
    return await this.table.where({ tenantId, studentId }).toArray();
  }

  async findByStudentAndAssignment(
    tenantId: string,
    studentId: string,
    assignmentId: string
  ): Promise<Submission | null> {
    const result = await this.table
      .where('[studentId+assignmentId]')
      .equals([studentId, assignmentId])
      .filter(s => s.tenantId === tenantId)
      .first();
    return result || null;
  }
}

export const submissionRepository = new SubmissionRepository();

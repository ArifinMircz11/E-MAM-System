import { BaseRepository } from './base/BaseRepository';
import type { StudentPointSummary } from '@/domain/point/pointDomain';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

export class PointSummaryRepository extends BaseRepository<StudentPointSummary> {
  constructor() {
    super('student_point_summaries');
  }

  async findById(id: string, tenantId: string): Promise<StudentPointSummary | null> {
    return (await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<StudentPointSummary[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: StudentPointSummary): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'student_point_summaries',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId as string,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: StudentPointSummary): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'student_point_summaries',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId as string,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'student_point_summaries',
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

  async getByStudent(studentId: string, tenantId?: string): Promise<StudentPointSummary | null> {
    if (tenantId) {
      return (
        (await this.table
          .where('tenantId')
          .equals(tenantId)
          .filter((s: any) => s.studentsId === studentId || s.studentId === studentId || s.id === studentId)
          .first()) || null
      );
    }
    return (
      (await this.table
        .filter((s: any) => s.studentsId === studentId || s.studentId === studentId || s.id === studentId)
        .first()) || null
    );
  }
}

export const pointSummaryRepository = new PointSummaryRepository();

import { BaseRepository } from './base/BaseRepository';
import type { SecurityContext } from '@/core/security/types';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import Dexie from 'dexie';

export interface GradeEntity extends AppEntity {
  studentId: string;
  subjectId: string;
  subjectName: string;
  className: string;
  score: number;
  semesterId: string;
  academicYearId: string;
  teacherId: string;
  type: string;
}

class GradeRepository extends BaseRepository<GradeEntity> {
  constructor() {
    super('penilaian');
  }

  async findById(id: string, tenantId: string): Promise<GradeEntity | null> {
    return (await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<GradeEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: GradeEntity): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'penilaian',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: GradeEntity): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'penilaian',
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
      await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'penilaian',
        action: 'DELETE',
        payload: { id },
        tenantId: tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(tenantId: string): Promise<void> {}

  async getByStudent(context: SecurityContext, studentId: string): Promise<GradeEntity[]> {
    return this.table
      .where('[tenantId+studentId+subjectId]')
      .between([context.tenantId, studentId, Dexie.minKey], [context.tenantId, studentId, Dexie.maxKey])
      .toArray();
  }

  async getByClass(context: SecurityContext, className: string): Promise<GradeEntity[]> {
    return this.table
      .where('tenantId')
      .equals(context.tenantId)
      .filter(g => g.className === className)
      .toArray();
  }
}

export const gradeRepository = new GradeRepository();

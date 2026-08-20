import { BaseRepository } from './base/BaseRepository';
import { localDb } from '@/database/dexie';
import type { BaseEntity } from '@/entities/BaseEntity';
import { syncRepository } from './SyncRepository';

export interface DashboardSummaryEntity extends BaseEntity {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRateToday: number;
  totalViolations: number;
  totalAchievements: number;
}

/**
 * DashboardSummaryRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class DashboardSummaryRepository extends BaseRepository<DashboardSummaryEntity> {
  constructor() {
    super('dashboard_summaries');
  }

  async findById(id: string, tenantId: string): Promise<DashboardSummaryEntity | null> {
    return (await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<DashboardSummaryEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: DashboardSummaryEntity): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'dashboard_summaries',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId || 'global',
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: DashboardSummaryEntity): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'dashboard_summaries',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId || 'global',
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'dashboard_summaries',
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
}

export const dashboardSummaryRepository = new DashboardSummaryRepository();

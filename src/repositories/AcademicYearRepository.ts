import { BaseRepository } from './base/BaseRepository';
import type { AcademicYear } from '@/domain/entities/schedule';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

/**
 * AcademicYearRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class AcademicYearRepository extends BaseRepository<AcademicYear> {
  constructor() {
    super('academic_years');
  }

  async findById(id: string, tenantId: string): Promise<AcademicYear | null> {
    return (await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<AcademicYear[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: AcademicYear): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'academic_years',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: AcademicYear): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'academic_years',
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
      await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'academic_years',
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

  async fetchByTenant(tenantId: string): Promise<AcademicYear[]> {
    return await this.findAll(tenantId);
  }
}

export const academicYearRepository = new AcademicYearRepository();

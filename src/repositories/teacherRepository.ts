import { BaseRepository } from './base/BaseRepository';
import type { Teacher } from '@/domain/entities/teacher';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import type { SecurityContext } from '@/core/security/types';

/**
 * TeacherRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class TeacherRepository extends BaseRepository<Teacher> {
  constructor() {
    super('teachers');
  }

  async findById(id: string, tenantId: string): Promise<Teacher | null> {
    return (await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId).first()) || null;
  }

  async fetchByIdUnik(tenantId: string, idUnik: string): Promise<Teacher | null> {
    const teacher = await this.table.get(idUnik);
    if (!teacher || teacher.tenantId !== tenantId) return null;
    return teacher;
  }

  async findAll(tenantId: string): Promise<Teacher[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Teacher): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'teachers',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Teacher): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'teachers',
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
      await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'teachers',
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

  async findByNip(tenantId: string, nip: string): Promise<Teacher | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((t) => t.nip === nip).first()) || null;
  }

  async findByIdUnik(tenantId: string, idUnik: string): Promise<Teacher | null> {
    return await this.findById(idUnik, tenantId);
  }

  async findByNik(tenantId: string, nik: string): Promise<Teacher | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((t) => t.nik === nik).first()) || null;
  }

  async fetchByTenant(arg1: SecurityContext | string, arg2?: string): Promise<Teacher[]> {
    const tenantId = typeof arg1 === 'string' ? arg1 : arg2 || (arg1 as any)?.tenantId;
    return await this.findAll(tenantId);
  }

  async getByTenant(arg1: SecurityContext | string, arg2?: string): Promise<Teacher[]> {
    return await this.fetchByTenant(arg1, arg2);
  }
  async findByUserId(tenantId: string, userId: string): Promise<Teacher | null> {
    return (
      (await this.table
        .where('tenantId')
        .equals(tenantId)
        .filter((t: any) => t.userId === userId || t.linkedUserId === userId || t.authUid === userId || t.userUid === userId)
        .first()) || null
    );
  }
}

export const teacherRepository = new TeacherRepository();

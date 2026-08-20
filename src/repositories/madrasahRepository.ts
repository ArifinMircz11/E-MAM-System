import { BaseRepository } from './base/BaseRepository';
import { Madrasah } from '@/features/madrasah/types';
import { SecurityContext } from '@/core/security/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

/**
 * MadrasahRepository
 *
 * SSOT for the 'madrasah' table in Dexie.
 * Extends BaseRepository to provide standardized atomic operations.
 */
export class MadrasahRepository extends BaseRepository<any> {
  constructor() {
    super('madrasah');
  }

  /**
   * Retrieves all active madrasahs.
   * Enforces security context boundaries.
   */
  async getAll(ctx: SecurityContext): Promise<any[]> {
    this.validateContext(ctx, 'getAll');
    // Only developers can see all madrasahs
    if (ctx.role === 'developer') {
      return await this.table.filter((m: Madrasah) => !m.deleted).toArray();
    }
    // Others only see their own tenant
    return await this.table.where('tenantId').equals(ctx.tenantId).filter((m: Madrasah) => !m.deleted).toArray();
  }

  async findById(id: string): Promise<Madrasah | null> {
    return (await this.table.get(id)) || null;
  }

  /**
   * Atomic Soft Delete
   */
  async softDelete(id: string, deletedBy: string): Promise<void> {
    const existing = await this.table.get(id);
    if (!existing) return;

    const updated = {
      ...existing,
      deleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };

    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(updated);
      await syncRepository.enqueue({
        collection: 'madrasah',
        action: 'UPDATE',
        payload: updated,
        tenantId: existing.tenantId || id,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  /**
   * Standardized save with atomic sync queue enrollment.
   */
  async saveMadrasah(madrasah: any): Promise<void> {
    const dataToSave = {
      ...madrasah,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'madrasah',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: madrasah.tenantId || madrasah.id,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }
}

export const madrasahRepository = new MadrasahRepository();
export const tenantRepository = madrasahRepository; // Alias for backward compatibility

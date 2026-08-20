import { BaseRepository } from './base/BaseRepository';
import type { DayEntity } from '@/domain/entities/schedule';
import { localDb } from '@/database/dexie';

/**
 * DayRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class DayRepository extends BaseRepository<DayEntity> {

  async findById(id: string, tenantId: string): Promise<DayEntity | null> {
    return (await this.table.where('id').equals(id).filter(d => d.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<DayEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: DayEntity): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: DayEntity): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(d => d.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  // --- BUSINESS-SPECIFIC METHODS ---

  async fetchAllDays(tenantId: string): Promise<DayEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).sortBy('order');
  }
}

export const dayRepository = new DayRepository();

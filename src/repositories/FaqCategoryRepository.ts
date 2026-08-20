import { BaseRepository } from './base/BaseRepository';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface FaqCategoryEntity extends AppEntity, Record<string, any> {
  id: string;
  npsn: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive: boolean;
}

export class FaqCategoryRepository extends BaseRepository<FaqCategoryEntity> {

  async findById(id: string, tenantId: string): Promise<FaqCategoryEntity | null> {
    return (await this.table.where('id').equals(id).filter(c => c.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<FaqCategoryEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: FaqCategoryEntity): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: FaqCategoryEntity): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(c => c.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getActiveCategories(tenantId: string): Promise<FaqCategoryEntity[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((c: any) => c.isActive !== false)
      .toArray();
  }
}

export const faqCategoryRepository = new FaqCategoryRepository();

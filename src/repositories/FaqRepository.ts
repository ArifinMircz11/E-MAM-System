import { BaseRepository } from './base/BaseRepository';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface FaqEntity extends AppEntity, Record<string, any> {
  id: string;
  npsn: string;
  categoryId: string;
  question: string;
  answer: string;
  keywords?: string[];
  attachmentUrl?: string;
  isPublished: boolean;
  viewCount?: number;
  helpfulCount?: number;
  notHelpfulCount?: number;
}

export class FaqRepository extends BaseRepository<FaqEntity> {

  async findById(id: string, tenantId: string): Promise<FaqEntity | null> {
    return (await this.table.where('id').equals(id).filter(f => f.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<FaqEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: FaqEntity): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: FaqEntity): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(f => f.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getPublishedFaqs(tenantId: string, categoryId?: string): Promise<FaqEntity[]> {
    let q = this.table.where('tenantId').equals(tenantId).filter((f: any) => f.isPublished !== false);
    let items = await q.toArray();
    if (categoryId && categoryId !== 'all') {
      items = items.filter((f) => f.categoryId === categoryId);
    }
    return items;
  }

  async searchFaqs(tenantId: string, queryText: string): Promise<FaqEntity[]> {
    const all = await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((f: any) => f.isPublished !== false)
      .toArray();
    const query = queryText.toLowerCase().trim();
    if (!query) return all;
    return all.filter(
      (f) =>
        f.question.toLowerCase().includes(query) ||
        f.answer.toLowerCase().includes(query) ||
        (f.keywords && f.keywords.some((kw: string) => kw.toLowerCase().includes(query)))
    );
  }
}

export const faqRepository = new FaqRepository();

import { BaseRepository } from './base/BaseRepository';
import type { SurveyTemplate } from '@/types/survey';
import { localDb } from '@/database/dexie';

export class SurveyTemplateRepository extends BaseRepository<SurveyTemplate> {

  async findById(id: string, tenantId: string): Promise<SurveyTemplate | null> {
    return (await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SurveyTemplate[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SurveyTemplate): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SurveyTemplate): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getTemplates(tenantId: string): Promise<SurveyTemplate[]> {
    return await this.findAll(tenantId);
  }
}

export const surveyTemplateRepository = new SurveyTemplateRepository();

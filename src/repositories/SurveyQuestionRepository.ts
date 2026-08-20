import { BaseRepository } from './base/BaseRepository';
import type { SurveyQuestion } from '@/types/survey';
import { localDb } from '@/database/dexie';

export class SurveyQuestionRepository extends BaseRepository<SurveyQuestion> {

  async findById(id: string, tenantId: string): Promise<SurveyQuestion | null> {
    return (await this.table.where('id').equals(id).filter(q => q.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SurveyQuestion[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SurveyQuestion): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SurveyQuestion): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(q => q.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getQuestionsForService(tenantId: string, serviceType: string): Promise<SurveyQuestion[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((item: SurveyQuestion) => item.isActive !== false && (item.serviceType === serviceType || item.serviceType === 'all'))
      .toArray();
  }
}

export const surveyQuestionRepository = new SurveyQuestionRepository();

import { BaseRepository } from './base/BaseRepository';
import type { SurveyAnswer } from '@/types/survey';
import { localDb } from '@/database/dexie';

export class SurveyAnswerRepository extends BaseRepository<SurveyAnswer> {

  async findById(id: string, tenantId: string): Promise<SurveyAnswer | null> {
    return (await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SurveyAnswer[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SurveyAnswer): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SurveyAnswer): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getAnswersForSurvey(tenantId: string, surveyId: string): Promise<SurveyAnswer[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((a: SurveyAnswer) => a.surveyId === surveyId)
      .toArray();
  }
}

export const surveyAnswerRepository = new SurveyAnswerRepository();

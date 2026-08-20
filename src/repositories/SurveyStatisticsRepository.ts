import { BaseRepository } from './base/BaseRepository';
import type { SurveyStatistics } from '@/types/survey';
import { localDb } from '@/database/dexie';

export class SurveyStatisticsRepository extends BaseRepository<SurveyStatistics> {

  async findById(id: string, tenantId: string): Promise<SurveyStatistics | null> {
    return (await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SurveyStatistics[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SurveyStatistics): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SurveyStatistics): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getStatistics(tenantId: string): Promise<SurveyStatistics[]> {
    return await this.findAll(tenantId);
  }
}

export const surveyStatisticsRepository = new SurveyStatisticsRepository();

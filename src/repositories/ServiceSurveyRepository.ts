import { BaseRepository } from './base/BaseRepository';
import type { ServiceSurvey } from '@/types/survey';
import { localDb } from '@/database/dexie';

export class ServiceSurveyRepository extends BaseRepository<ServiceSurvey> {

  async findById(id: string, tenantId: string): Promise<ServiceSurvey | null> {
    return (await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<ServiceSurvey[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: ServiceSurvey): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: ServiceSurvey): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getByServiceType(tenantId: string, serviceType: string): Promise<ServiceSurvey[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((s: ServiceSurvey) => s.serviceType === serviceType)
      .toArray();
  }

  async getByRespondent(tenantId: string, respondentId: string): Promise<ServiceSurvey[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((s: ServiceSurvey) => s.respondentId === respondentId)
      .toArray();
  }
}

export const serviceSurveyRepository = new ServiceSurveyRepository();

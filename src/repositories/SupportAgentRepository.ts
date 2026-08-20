import { BaseRepository } from './base/BaseRepository';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface SupportAgentEntity extends AppEntity, Record<string, any> {
  id: string;
  userId: string;
  name: string;
  role: string;
  department: string;
  photoURL?: string;
  status: 'online' | 'offline' | 'busy';
  lastActive: number;
  maxChats?: number;
}

export class SupportAgentRepository extends BaseRepository<SupportAgentEntity> {

  async findById(id: string, tenantId: string): Promise<SupportAgentEntity | null> {
    return (await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SupportAgentEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SupportAgentEntity): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SupportAgentEntity): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getActiveAgents(tenantId: string): Promise<SupportAgentEntity[]> {
    return await this.findAll(tenantId);
  }
}

export const supportAgentRepository = new SupportAgentRepository();

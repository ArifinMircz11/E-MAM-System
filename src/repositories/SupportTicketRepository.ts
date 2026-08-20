import { BaseRepository } from './base/BaseRepository';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';

export interface SupportTicketEntity extends AppEntity, Record<string, any> {
  id: string;
  ticketNumber: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat';
  assignedAgentId?: string;
  dueDate?: number;
  status: 'Open' | 'Waiting' | 'On Progress' | 'Closed' | 'Escalated';
  resolution?: string;
  resolvedAt?: number;
}

export class SupportTicketRepository extends BaseRepository<SupportTicketEntity> {
  constructor() {
    super('support_tickets');
  }

  async findById(id: string, tenantId: string): Promise<SupportTicketEntity | null> {
    return (await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SupportTicketEntity[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SupportTicketEntity): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SupportTicketEntity): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getByUser(tenantId: string, userId: string): Promise<SupportTicketEntity[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((t) => t.userId === userId)
      .toArray();
  }
}

export const supportTicketRepository = new SupportTicketRepository();

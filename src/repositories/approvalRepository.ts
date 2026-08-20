import { BaseRepository } from './base/BaseRepository';
import { localDb } from '@/database/dexie';
import type { AppEntity } from '@/domain/entities/base';

// TODO: Import proper entity type
export interface ApprovalRequest extends AppEntity, Record<string, any> {
  id: string;
  tenantId: string;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * ApprovalRepository
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class ApprovalRepository extends BaseRepository<ApprovalRequest> {
  constructor() {
    super('approval_requests');
  }

  async findById(id: string, tenantId: string): Promise<ApprovalRequest | null> {
    return (await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<ApprovalRequest[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: ApprovalRequest): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: ApprovalRequest): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  // --- BUSINESS-SPECIFIC METHODS ---

  async createRequest(
    data: ApprovalRequest,
  ): Promise<void> {
    await this.create(data);
  }

  async approveRequest(id: string, tenantId: string): Promise<void> {
    const request = await this.findById(id, tenantId);
    if (request) {
      await this.update({ ...request, status: 'approved' });
    }
  }

  async rejectRequest(id: string, tenantId: string): Promise<void> {
    const request = await this.findById(id, tenantId);
    if (request) {
      await this.update({ ...request, status: 'rejected' });
    }
  }

  async getPendingRequests(tenantId: string): Promise<ApprovalRequest[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((r) => r.status === 'pending')
      .toArray();
  }
}

export const approvalRepository = new ApprovalRepository();

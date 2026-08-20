import { BaseRepository } from './base/BaseRepository';
import type { ProfileUpdateRequest } from '@/domain/entities/profileRequest';
import { localDb } from '@/database/dexie';

export class ProfileRequestRepository extends BaseRepository<ProfileUpdateRequest> {

  async findById(id: string, tenantId: string): Promise<ProfileUpdateRequest | null> {
    return (await this.table.where('id').equals(id).filter(r => r.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<ProfileUpdateRequest[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: ProfileUpdateRequest): Promise<void> {
    await this.table.add(entity);
    await localDb.sync_queue.add({
      id: `sq_${Date.now()}_${entity.id}`,
      tenantId: entity.tenantId,
      collection: 'profile_update_requests',
      documentId: entity.id,
      operation: 'create',
      payload: entity,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      priority: 1
    });
  }

  async update(entity: ProfileUpdateRequest): Promise<void> {
    await this.table.put(entity);
    await localDb.sync_queue.add({
      id: `sq_${Date.now()}_${entity.id}`,
      tenantId: entity.tenantId,
      collection: 'profile_update_requests',
      documentId: entity.id,
      operation: 'update',
      payload: entity,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      priority: 1
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(r => r.tenantId === tenantId).delete();
    await localDb.sync_queue.add({
      id: `sq_${Date.now()}_${id}`,
      tenantId: tenantId,
      collection: 'profile_update_requests',
      documentId: id,
      operation: 'delete',
      payload: { id, deleted: true },
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      priority: 1
    });
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getPendingByTenant(tenantId: string): Promise<ProfileUpdateRequest[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((r) => r.status === 'pending')
      .toArray();
  }

  async fetchPending(tenantId: string): Promise<ProfileUpdateRequest[]> {
    return this.getPendingByTenant(tenantId);
  }
}

export const profileRequestRepository = new ProfileRequestRepository();

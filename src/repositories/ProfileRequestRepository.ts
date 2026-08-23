import { BaseRepository } from './base/BaseRepository';
import type { ProfileUpdateRequest } from '@/domain/entities/profileRequest';
import { syncRepository } from '@/repositories/SyncRepository';

export class ProfileRequestRepository extends BaseRepository<ProfileUpdateRequest> {

  async findById(id: string, tenantId: string): Promise<ProfileUpdateRequest | null> {
    return (await this.table.where('id').equals(id).filter(r => r.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<ProfileUpdateRequest[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: ProfileUpdateRequest): Promise<void> {
    await this.table.add(entity);
    await syncRepository.enqueue({
      tenantId: entity.tenantId,
      collection: 'profile_update_requests',
      action: 'CREATE',
      payload: entity,
    });
  }

  async update(entity: ProfileUpdateRequest): Promise<void> {
    await this.table.put(entity);
    await syncRepository.enqueue({
      tenantId: entity.tenantId,
      collection: 'profile_update_requests',
      action: 'UPDATE',
      payload: entity,
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(r => r.tenantId === tenantId).delete();
    await syncRepository.enqueue({
      tenantId,
      collection: 'profile_update_requests',
      action: 'DELETE',
      payload: { id, deleted: true },
    });
  }

  async refresh(_tenantId: string): Promise<void> {
    // Sync logic is handled by SyncEngine.
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

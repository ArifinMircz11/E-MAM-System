import { BaseRepository } from './base/BaseRepository';
import type { User } from '@/domain/entities/user';
import type { SecurityContext } from '@/core/context/TenantContext';
import type { UserRole } from '@/types/roles';
import { localDb } from '@/database/dexie';

export class UserRoleRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    return (await this.table.where('id').equals(id).filter(u => u.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<User[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: User): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: User): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(u => u.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  // --- BUSINESS-SPECIFIC METHODS ---

  async updateRoles(context: SecurityContext, userId: string, roles: UserRole[]): Promise<void> {
    await this.table.update(userId, { roles });
  }
}

export const userRoleRepository = new UserRoleRepository();

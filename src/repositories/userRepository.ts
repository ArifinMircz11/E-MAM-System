import { BaseRepository } from './base/BaseRepository';
import type { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { validateCanonicalUser } from '@/identity/domain/CanonicalValidation';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

/**
 * UserRepository
 * Dexie is the operational source of truth. Remote authentication bootstrap
 * may materialize an authoritative user through cacheAuthoritative(), which
 * intentionally does not enqueue a mutation because the record came from sync.
 */
export class UserRepository extends BaseRepository<CanonicalUser> {
  constructor() {
    super('users');
  }

  async findById(id: string, tenantId?: string): Promise<CanonicalUser | null> {
    const user = await this.table.get(id);
    if (!user) return null;
    if (tenantId && tenantId !== 'global' && user.tenantId !== tenantId) return null;
    return user;
  }

  async findAll(tenantId: string): Promise<CanonicalUser[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async fetchByTenant(tenantId: string, limitVal?: number): Promise<CanonicalUser[]> {
    const arr = await this.findAll(tenantId);
    return limitVal ? arr.slice(0, limitVal) : arr;
  }

  async cacheAuthoritative(entity: CanonicalUser): Promise<void> {
    const validation = validateCanonicalUser(entity);
    if (!validation.valid) throw new Error(`Invalid authoritative user: ${validation.missing.join(', ')}`);
    await this.table.put({ ...entity, syncStatus: 'synced' as any, updatedAt: Date.now() });
  }

  async create(entity: CanonicalUser): Promise<void> {
    const validation = validateCanonicalUser(entity);
    if (!validation.valid) throw new Error(`Invalid user entity: ${validation.missing.join(', ')}`);
    const dataToSave = { ...entity, syncStatus: 'pending' as any, updatedAt: Date.now() };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({ collection: 'users', action: 'CREATE', payload: dataToSave, tenantId: entity.tenantId }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: CanonicalUser): Promise<void> {
    const validation = validateCanonicalUser(entity);
    if (!validation.valid) throw new Error(`Invalid user entity: ${validation.missing.join(', ')}`);
    const dataToSave = { ...entity, syncStatus: 'pending' as any, updatedAt: Date.now() };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({ collection: 'users', action: 'UPDATE', payload: dataToSave, tenantId: entity.tenantId }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId?: string): Promise<void> {
    const activeTenant = tenantId || 'global';
    const existing = await this.table.get(id);
    if (!existing || (activeTenant !== 'global' && existing.tenantId !== activeTenant)) return;
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.delete(id);
      await syncRepository.enqueue({ collection: 'users', action: 'DELETE', payload: { id }, tenantId: activeTenant }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(_tenantId: string): Promise<void> {}

  async findByIdUnik(_tenantId: string, idUnik: string): Promise<CanonicalUser | null> {
    const direct = await this.table.get(idUnik);
    return direct || (await this.table.filter(u => u.idUnik === idUnik).first()) || null;
  }

  async findByNip(_tenantId: string, nip: string): Promise<CanonicalUser | null> {
    return (await this.table.filter(u => u.profile?.nip === nip).first()) || null;
  }

  async findByNik(_tenantId: string, nik: string): Promise<CanonicalUser | null> {
    return (await this.table.filter(u => u.profile?.nik === nik).first()) || null;
  }

  async getByUid(uid: string): Promise<CanonicalUser | null> {
    return (await this.table.where('uid').equals(uid).first()) || null;
  }

  async getByEmail(email: string): Promise<CanonicalUser | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return (await this.table.where('email').equals(normalizedEmail).first()) || (await this.table.where('profile.email').equals(normalizedEmail).first()) || null;
  }

  async findByEmail(email: string): Promise<CanonicalUser | null> { return this.getByEmail(email); }

  async fetchPendingRegistrations(tenantId?: string): Promise<CanonicalUser[]> {
    const collection = this.table.where('status').equals('pending');
    return tenantId && tenantId !== 'global' ? collection.filter(u => u.tenantId === tenantId).toArray() : collection.toArray();
  }

  async deleteByUid(uid: string): Promise<void> { await this.table.where('uid').equals(uid).delete(); }
  async getAllUsers(): Promise<CanonicalUser[]> { return this.table.toArray(); }
}

export const userRepository = new UserRepository();

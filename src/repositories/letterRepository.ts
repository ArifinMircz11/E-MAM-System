import { BaseRepository } from './base/BaseRepository';
import type { LetterRequest } from '@/types';
import type { SecurityContext } from '@/core/security/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import { SyncStatus } from '@/domain/entities/base';
import Dexie from 'dexie';

/**
 * LetterRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class LetterRepository extends BaseRepository<LetterRequest> {
  constructor() {
    super('letters');
  }

  async findById(id: string, tenantId: string): Promise<LetterRequest | null> {
    return (await this.table.where('id').equals(id).filter(l => l.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<LetterRequest[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: LetterRequest): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      const now = Date.now();
      const dataToSave = {
        ...entity,
        version: 1,
        syncStatus: SyncStatus.PENDING as SyncStatus,
        updatedAt: now,
      };
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'letters',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
        metadata: {
          idempotencyKey: `letter/${entity.id}:create:v1`,
          version: 1,
        }
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: LetterRequest): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      const existing = await this.table.get(entity.id);
      if (!existing) throw new Error("Letter record not found");
      if (existing.tenantId !== entity.tenantId) throw new Error("Tenant mismatch");

      const newVersion = (existing.version || 0) + 1;
      const now = Date.now();
      const dataToSave = {
        ...entity,
        version: newVersion,
        syncStatus: SyncStatus.PENDING as SyncStatus,
        updatedAt: now,
      };
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'letters',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
        metadata: {
          idempotencyKey: `letter/${entity.id}:update:v${newVersion}`,
          version: newVersion,
        }
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(l => l.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'letters',
        action: 'DELETE',
        payload: { id },
        tenantId: tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  // --- BUSINESS-SPECIFIC METHODS ---

  async findLatestLetters(context: SecurityContext, tenantId: string): Promise<LetterRequest[]> {
    const targetTenant = context.isDeveloper ? tenantId : context.tenantId;
    return await this.table
      .where('[tenantId+updatedAt]')
      .between([targetTenant, Dexie.minKey], [targetTenant, Dexie.maxKey])
      .reverse()
      .toArray();
  }

  async getByUserId(userId: string): Promise<LetterRequest[]> {
    return await this.table.where('userId').equals(userId).toArray();
  }

  async fetchByTenant(tenantId: string): Promise<LetterRequest[]> {
    return await this.findAll(tenantId);
  }

  async findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<LetterRequest | null> {
    return (
      (await this.table
        .where('tenantId')
        .equals(tenantId)
        .filter((l: any) => l.idempotencyKey === idempotencyKey)
        .first()) || null
    );
  }
}

export const letterRepository = new LetterRepository();

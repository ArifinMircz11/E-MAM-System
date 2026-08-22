import { BaseRepository } from './base/BaseRepository';
import type { AppNotification } from '@/domain/entities/notification';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

/**
 * NotificationRepository
 *
 * Dexie is the operational source of truth. All notification reads and
 * mutations stay behind this repository boundary.
 */
export class NotificationRepository extends BaseRepository<AppNotification> {
  constructor() {
    super('notifications');
  }

  async findById(id: string, tenantId: string): Promise<AppNotification | null> {
    return (await this.table.where('id').equals(id).filter(n => n.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<AppNotification[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: AppNotification): Promise<void> {
    const dataToSave = { ...entity, syncStatus: 'pending' as any, updatedAt: Date.now() };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({ collection: 'notifications', action: 'CREATE', payload: dataToSave, tenantId: entity.tenantId }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: AppNotification): Promise<void> {
    const dataToSave = { ...entity, syncStatus: 'pending' as any, updatedAt: Date.now() };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({ collection: 'notifications', action: 'UPDATE', payload: dataToSave, tenantId: entity.tenantId }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(n => n.tenantId === tenantId).delete();
      await syncRepository.enqueue({ collection: 'notifications', action: 'DELETE', payload: { id }, tenantId }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(_tenantId: string): Promise<void> {}

  /** Retrieves notifications for a user within the authoritative tenant. */
  async getByUserId(userId: string, tenantId: string): Promise<AppNotification[]> {
    return await this.table
      .where('userId').equals(userId)
      .filter(notification => notification.tenantId === tenantId)
      .toArray();
  }

  async markAsReadBatch(ids: string[]): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      for (const id of ids) {
        const existing = await this.table.get(id);
        if (existing) {
          const finalData = { ...existing, isRead: true, updatedAt: Date.now(), syncStatus: 'pending' as any };
          await this.table.put(finalData);
          await syncRepository.enqueue({ collection: 'notifications', action: 'UPDATE', payload: finalData, tenantId: existing.tenantId }, undefined, { triggerSync: false, db: dbInstance });
        }
      }
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }
}

export const notificationRepository = new NotificationRepository();

import { BaseRepository } from './base/BaseRepository';
import type { SecurityContext } from '@/core/security/types';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

export interface SchoolEvent extends AppEntity {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  tenantId: string;
  category: 'Lomba' | 'Pentas' | 'Seminar' | 'Lainnya';
  participants?: {
    name: string;
    class: string;
    registeredAt: string;
    userId?: string;
  }[];
  maxParticipants?: number;
  status: 'Buka' | 'Tutup' | 'Selesai';
}

class EventRepository extends BaseRepository<SchoolEvent> {
  constructor() {
    super('events');
  }

  async findById(id: string, tenantId: string): Promise<SchoolEvent | null> {
    return (await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SchoolEvent[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SchoolEvent): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'events',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: SchoolEvent): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'events',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'events',
        action: 'DELETE',
        payload: { id },
        tenantId: tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(tenantId: string): Promise<void> {}

  async getByTenant(context: SecurityContext): Promise<SchoolEvent[]> {
    return this.table
      .where('tenantId')
      .equals(context.tenantId)
      .reverse()
      .sortBy('date');
  }

  async registerParticipant(
    context: SecurityContext,
    eventId: string,
    participant: { name: string; class: string; userId?: string }
  ): Promise<void> {
    const event = await this.findById(eventId, context.tenantId);
    if (!event) throw new Error('Event not found');

    const participants = event.participants || [];
    participants.push({
      ...participant,
      registeredAt: new Date().toISOString(),
    });

    await this.update({ ...event, participants } as SchoolEvent);
  }
}

export const eventRepository = new EventRepository();

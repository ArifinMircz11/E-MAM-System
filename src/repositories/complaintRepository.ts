import { BaseRepository } from './base/BaseRepository';
import type { SecurityContext } from '@/core/security/types';
import type { AppEntity } from '@/domain/entities/base';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';

export interface Complaint extends AppEntity, Record<string, any> {
  id: string;
  tenantId: string;
  roomType: 'complaint_internal' | 'complaint_publik';
  targetRombel: string;
  lastTimestamp: any;
}

export class ComplaintRepository extends BaseRepository<Complaint> {
  constructor() {
    super('complaints');
  }

  async findById(id: string, tenantId: string): Promise<Complaint | null> {
    return (await this.table.where('id').equals(id).filter(c => c.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Complaint[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Complaint): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'complaints',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Complaint): Promise<void> {
    const dataToSave = {
      ...entity,
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'complaints',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dbInstance = this.db;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.where('id').equals(id).filter(c => c.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'complaints',
        action: 'DELETE',
        payload: { id },
        tenantId: tenantId,
      }, undefined, { triggerSync: false });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(tenantId: string): Promise<void> {}

  async createComplaint(data: Complaint): Promise<Complaint> {
    await this.create(data);
    return data;
  }

  async updateComplaint(data: Complaint): Promise<Complaint> {
    await this.update(data);
    return data;
  }

  async getComplaints(tenantId: string, rombel: string): Promise<Complaint[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((c) => (c.roomType === 'complaint_internal' || c.roomType === 'complaint_publik') && c.targetRombel === rombel)
      .toArray();
  }

  async getComplaintById(tenantId: string, id: string): Promise<Complaint | undefined> {
    const item = await this.findById(id, tenantId);
    return item ?? undefined;
  }
}

export const complaintRepository = new ComplaintRepository();

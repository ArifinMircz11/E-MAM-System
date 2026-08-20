import type { AppEntity } from "@/domain/entities/base";
import { TenantContext } from "@/core/context/TenantContext";
import { localDb } from '@/database/dexie';
import { BaseRepository } from './base/BaseRepository';

export interface NotificationLog extends AppEntity {
   title: string;
   message: string;
   timestamp: number;
   type: string;
   isRead: boolean;
}

export class NotificationLogRepository extends BaseRepository<NotificationLog> {

  async findById(id: string, tenantId: string): Promise<NotificationLog | null> {
    return (await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<NotificationLog[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: NotificationLog): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: NotificationLog): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {}

  async getLogs(context: any, limitCount: number = 100): Promise<any[]> {
    const tenantId = context.tenantId;
    if (!tenantId) return [];

    const logs = await this.table
      .where('tenantId')
      .equals(tenantId)
      .toArray();

    return logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limitCount);
  }
}
export const notificationLogRepository = new NotificationLogRepository();

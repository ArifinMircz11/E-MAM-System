import { BaseRepository } from './base/BaseRepository';
import type { TickerItem } from '@/types';
import { localDb } from '@/database/dexie';

export class TickerRepository extends BaseRepository<TickerItem> {
  constructor() {
    super('ticker');
  }

  async findById(id: string, tenantId: string): Promise<TickerItem | null> {
    try {
      return (await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId || (t as any).tenantsId === tenantId).first()) || null;
    } catch {
      return null;
    }
  }

  async findAll(tenantId: string): Promise<TickerItem[]> {
    try {
      const hasIndex = this.table.schema.indexes.some(i => i.name === 'tenantId');
      if (hasIndex && tenantId && tenantId !== 'global') {
        return await this.table.where('tenantId').equals(tenantId).toArray();
      }
      const all = await this.table.toArray();
      if (!tenantId || tenantId === 'global') return all;
      return all.filter(t => t.tenantId === tenantId || (t as any).tenantsId === tenantId || t.tenantId === 'global');
    } catch (e) {
      console.warn('[TickerRepository] Fallback to array query:', e);
      try {
        const all = await this.table.toArray();
        if (!tenantId || tenantId === 'global') return all;
        return all.filter(t => t.tenantId === tenantId || (t as any).tenantsId === tenantId || t.tenantId === 'global');
      } catch {
        return [];
      }
    }
  }

  async create(entity: TickerItem): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: TickerItem): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  async getActive(tenantId: string): Promise<TickerItem[]> {
    return (await this.findAll(tenantId)).filter(t => t.isActive);
  }
}

export const tickerRepository = new TickerRepository();

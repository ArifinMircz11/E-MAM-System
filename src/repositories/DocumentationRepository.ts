import { BaseRepository } from './base/BaseRepository';
import type { SystemDocumentation } from '@/types';
import { localDb } from '@/database/dexie';

/**
 * DocumentationRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class DocumentationRepository extends BaseRepository<SystemDocumentation> {

  async findById(id: string, tenantId: string): Promise<SystemDocumentation | null> {
    return (await this.table.where('id').equals(id).filter(d => d.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<SystemDocumentation[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: SystemDocumentation): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: SystemDocumentation): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(d => d.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  // --- BUSINESS-SPECIFIC METHODS ---

  async getAllDocs(tenantId: string): Promise<SystemDocumentation[]> {
    return await this.table.where('tenantId').equals(tenantId).reverse().sortBy('lastUpdated');
  }
}

export const documentationRepository = new DocumentationRepository();

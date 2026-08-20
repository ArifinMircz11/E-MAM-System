import type { AppEntity, CrudService } from '@/domain/entities/base';
import type { BaseRepository } from '@/repositories/BaseRepository';
import type { SecurityContext } from '@/core/security/types';
import { TenantContext } from '@/core/context/TenantContext';

/**
 * BASE SERVICE
 * Generic implementation of CrudService using BaseRepository.
 * Follows the UI -> Hook -> Service -> Repository flow.
 */
export class BaseService<T extends AppEntity> implements CrudService<T> {
  constructor(protected repository: BaseRepository<T>) {}

  protected getContext(): SecurityContext {
    return TenantContext.getContext();
  }

  async getAll(): Promise<T[]> {
    return await this.repository.getAll(this.getContext());
  }

  async getById(id: string): Promise<T | null> {
    return await this.repository.getById(this.getContext(), id);
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.repository.save(this.getContext(), data);
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Entity with ID ${id} not found`);
    return await this.repository.save(this.getContext(), { ...existing, ...data, id });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(this.getContext(), id);
  }

  async restore(id: string): Promise<void> {
    const existing = await this.repository.getById(this.getContext(), id);
    if (existing) {
      await this.repository.save(this.getContext(), { ...existing, deleted: false, updatedAt: Date.now() });
    }
  }

  async bulkImport(data: Partial<T>[]): Promise<{ successCount: number; errors: string[] }> {
    let successCount = 0;
    const errors: string[] = [];
    const context = this.getContext();

    for (const [index, item] of data.entries()) {
      try {
        await this.repository.save(context, item);
        successCount++;
      } catch (err: any) {
        errors.push(`Row ${index + 1}: ${err.message || String(err)}`);
      }
    }

    return { successCount, errors };
  }

  async export(type: 'excel' | 'pdf' | 'csv'): Promise<Blob | string> {
    // Basic export logic placeholder
    const data = await this.getAll();
    if (type === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
      return `${headers}\n${rows}`;
    }
    throw new Error(`Export type ${type} not implemented yet`);
  }
}

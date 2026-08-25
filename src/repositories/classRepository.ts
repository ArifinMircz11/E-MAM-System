import { BaseRepository } from './base/BaseRepository';
import type { Class } from '@/domain/entities/class';
import { getSecurityContext } from '@/core/security/contextHelper';

/**
 * Canonical operational repository for classes.
 * All mutations are delegated to BaseRepository so Dexie + SyncQueue,
 * tenant isolation, versioning and tombstones remain consistent.
 */
export class ClassRepository extends BaseRepository<Class> {
  constructor() {
    super('classes');
  }

  async findById(id: string, tenantId: string): Promise<Class | null> {
    const context = getSecurityContext(true);
    if (context.tenantId !== tenantId && !context.isDeveloper) return null;
    return super.findById(id, tenantId);
  }

  async findAll(tenantId: string): Promise<Class[]> {
    return super.findAll(tenantId);
  }

  async create(entity: Class): Promise<void> {
    const context = getSecurityContext(true);
    await super.create(context, entity);
  }

  async update(entity: Class): Promise<void> {
    const context = getSecurityContext(true);
    await super.save(context, entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const context = getSecurityContext(true);
    if (context.tenantId !== tenantId && !context.isDeveloper) return;
    await super.delete(context, id);
  }

  async refresh(_tenantId: string): Promise<void> {
    // Pull/materialization is owned by SyncEngine, not the repository.
  }

  async fetchByTenant(arg1: SecurityContextLike | string, arg2?: string): Promise<Class[]> {
    const tenantId = typeof arg1 === 'string' ? arg1 : arg2 || arg1.tenantId;
    return this.findAll(tenantId);
  }

  async getByTenant(arg1: SecurityContextLike | string, arg2?: string): Promise<Class[]> {
    return this.fetchByTenant(arg1, arg2);
  }

  async findByClassId(tenantId: string, classId: string): Promise<Class | null> {
    const context = getSecurityContext(true);
    if (context.tenantId !== tenantId && !context.isDeveloper) return null;
    const row = await this.table
      .where('[tenantId+classId]')
      .equals([tenantId, classId])
      .first();
    return row && (row as any).deleted !== true ? row : null;
  }
}

type SecurityContextLike = { tenantId: string };

export const classRepository = new ClassRepository();

import { BaseRepository } from './base/BaseRepository';
import type { Teacher } from '@/domain/entities/teacher';
import type { SecurityContext } from '@/core/security/types';
import { getSecurityContext } from '@/core/security/contextHelper';

/**
 * TeacherRepository
 * Primary operational repository: all mutations are persisted to Dexie first
 * and routed to SyncQueue by BaseRepository.
 */
export class TeacherRepository extends BaseRepository<Teacher> {
  constructor() {
    super('teachers');
  }

  async findById(id: string, tenantId: string): Promise<Teacher | null> {
    return (await this.table.where('id').equals(id).filter(t => t.tenantId === tenantId).first()) || null;
  }

  async fetchByIdUnik(tenantId: string, idUnik: string): Promise<Teacher | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((t: any) => t.idUnik === idUnik).first()) || null;
  }

  async findAll(tenantId: string): Promise<Teacher[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: Teacher): Promise<void> {
    await super.create(entity);
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Teacher): Promise<void> {
    await super.save(entity);
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const context = getSecurityContext(true);
    if (context.tenantId !== tenantId && !context.isDeveloper) {
      throw new Error('TeacherRepository.delete: tenantId tidak sesuai SecurityContext.');
    }
    await super.delete(context, id);
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(_tenantId: string): Promise<void> {
    // Pull/sync is owned by SyncEngine; repository remains local-only.
  }

  // --- BUSINESS-SPECIFIC METHODS ---

  async findByNip(tenantId: string, nip: string): Promise<Teacher | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((t) => t.nip === nip).first()) || null;
  }

  async findByIdUnik(tenantId: string, idUnik: string): Promise<Teacher | null> {
    return await this.fetchByIdUnik(tenantId, idUnik);
  }

  async findByNik(tenantId: string, nik: string): Promise<Teacher | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((t) => t.nik === nik).first()) || null;
  }

  async fetchByTenant(arg1: SecurityContext | string, arg2?: string): Promise<Teacher[]> {
    const tenantId = typeof arg1 === 'string' ? arg1 : arg2 || arg1.tenantId;
    return await this.findAll(tenantId);
  }

  async getByTenant(arg1: SecurityContext | string, arg2?: string): Promise<Teacher[]> {
    return await this.fetchByTenant(arg1, arg2);
  }

  async findByUserId(tenantId: string, userId: string): Promise<Teacher | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((t: any) => t.userId === userId || t.linkedUserId === userId || t.authUid === userId || t.userUid === userId).first()) || null;
  }
}

export const teacherRepository = new TeacherRepository();

import { BaseRepository } from '@/repositories/base/BaseRepository';
import type { Student } from '@/types';
import type { SecurityContext } from '@/core/security/types';
import { getSecurityContext } from '@/core/security/contextHelper';

/**
 * StudentRepository
 * Primary operational repository: all mutations are persisted to Dexie first
 * and routed to SyncQueue by BaseRepository.
 */
export class StudentRepository extends BaseRepository<Student> {
  constructor() { super('students'); }

  async save(context: SecurityContext, entity: Partial<Student>): Promise<Student>;
  async save(entity: Student): Promise<void>;
  async save(arg1: SecurityContext | Student, arg2?: Partial<Student>): Promise<Student | void> {
    if (arg2 !== undefined) {
      const entity = { ...arg2 } as Partial<Student>;
      entity.status = (entity.status || 'Aktif') as any;
      entity.classId = entity.classId || '';
      entity.idUnik = entity.idUnik || entity.id || '';
      return super.save(arg1 as SecurityContext, entity);
    }
    const entity = { ...(arg1 as Student) };
    entity.status = (entity.status || 'Aktif') as any;
    entity.classId = entity.classId || '';
    entity.idUnik = entity.idUnik || entity.id || '';
    return super.save(entity);
  }

  async findById(id: string, tenantId: string): Promise<Student | null> {
    const context = getSecurityContext(true);
    if (context.tenantId !== tenantId && !context.isDeveloper) return null;
    return super.findById(id, tenantId);
  }

  async findAll(tenantId: string): Promise<Student[]> { return super.findAll(tenantId); }

  async findByClass(classId: string, tenantId: string): Promise<Student[]> {
    return this.table.where('classId').equals(classId).filter((s: any) => s.tenantId === tenantId && s.deleted !== true).toArray();
  }

  async create(entity: Student): Promise<void> {
    const data = { ...entity, idUnik: entity.idUnik || entity.id, status: entity.status || 'Aktif', classId: entity.classId || '' } as Student;
    await super.create(data);
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Student): Promise<void> {
    const data = { ...entity, idUnik: entity.idUnik || entity.id, status: entity.status || 'Aktif', classId: entity.classId || '' } as Student;
    await super.save(data);
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const context = getSecurityContext(true);
    if (context.tenantId !== tenantId && !context.isDeveloper) throw new Error('StudentRepository.delete: tenantId tidak sesuai SecurityContext.');
    await super.delete(context, id);
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(_tenantId: string): Promise<void> {}

  async findByQrCode(tenantId: string, qrCode: string): Promise<Student | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((s: any) => s.deleted !== true && (s.idUnik === qrCode || s.studentId === qrCode || s.studentsId === qrCode || s.id === qrCode)).first()) || null;
  }

  async getByClassId(tenantId: string, classId: string): Promise<Student[]> {
    return this.table.where('tenantId').equals(tenantId).filter((s: any) => s.classId === classId && s.deleted !== true).toArray();
  }

  async searchByName(tenantId: string, query: string): Promise<Student[]> {
    return this.table.where('tenantId').equals(tenantId).filter((s: any) => s.deleted !== true && s.namaLengkap.toLowerCase().includes(query.toLowerCase())).limit(20).toArray();
  }

  async fetchByUserId(tenantId: string, userId: string): Promise<Student | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((s: any) => s.deleted !== true && (s.linkedUserId === userId || s.userUid === userId || s.authUid === userId)).first()) || null;
  }

  async getByTenant(tenantId: string): Promise<Student[]> { return this.findAll(tenantId); }

  async fetchByTenant(tenantId: string, limitVal?: number): Promise<Student[]> {
    const q = this.table.where('tenantId').equals(tenantId).filter((s: any) => s.deleted !== true);
    return limitVal ? q.limit(limitVal).toArray() : q.toArray();
  }

  async fetchByIdUnik(tenantId: string, idUnik: string): Promise<Student | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((s: any) => s.deleted !== true && s.idUnik === idUnik).first()) || null;
  }

  async fetchByNisn(tenantId: string, nisn: string): Promise<Student | null> {
    return (await this.table.where('tenantId').equals(tenantId).filter((s: any) => s.deleted !== true && s.nisn === nisn).first()) || null;
  }

  async deleteLocal(id: string, tenantId: string): Promise<void> { await this.delete(id, tenantId); }

  async updateFirestore(id: string, tenantId: string, data: Partial<Student>): Promise<void> {
    const current = await this.findById(id, tenantId);
    if (current) await this.update({ ...current, ...data });
  }

  async bulkImport(students: Student[]): Promise<void> { for (const s of students) await this.update(s); }

  async fetchPaginated(tenantId: string, _lastDoc: any, pageSize: number, filter?: any): Promise<any> {
    let q = this.table.where('tenantId').equals(tenantId).filter((s: any) => s.deleted !== true);
    if (filter?.class && filter.class !== 'All') q = q.filter((s: any) => s.classId === filter.class || s.className === filter.class);
    return { data: await q.limit(pageSize).toArray(), lastDoc: null };
  }

  async moveToArchive(id: string, tenantId: string, _target: string, reason: string, status: string): Promise<void> {
    const s = await this.findById(id, tenantId);
    if (s) await this.update({ ...s, status: status as any, archiveReason: reason } as any);
  }

  async promoteBatch(ids: string[], tenantId: string, updateData: any): Promise<void> {
    for (const id of ids) { const s = await this.findById(id, tenantId); if (s) await this.update({ ...s, ...updateData }); }
  }

  async getInvalidStudents(tenantId: string): Promise<Student[]> {
    return this.table.where('tenantId').equals(tenantId).filter((s: any) => s.deleted !== true && (!s.namaLengkap || !s.idUnik)).toArray();
  }
}

export const studentRepository = new StudentRepository();

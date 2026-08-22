import { BaseRepository } from '@/repositories/base/BaseRepository';
import type { Student } from '@/types';
import type { SecurityContext } from '@/core/security/types';
import { getSecurityContext } from '@/core/security/contextHelper';

/**
 * StudentRepository
 * Dexie is the operational database. BaseRepository owns the atomic
 * Dexie + SyncQueue mutation contract.
 */
export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super('students');
  }

  private currentContext(): SecurityContext {
    return getSecurityContext();
  }

  private normalize(entity: Partial<Student>): Partial<Student> {
    return {
      ...entity,
      status: (entity.status || 'Aktif') as any,
      classId: entity.classId || '',
      idUnik: entity.idUnik || entity.id || '',
    };
  }

  // Context-aware save remains the canonical mutation path.
  async save(context: SecurityContext, entity: Partial<Student>): Promise<Student>;
  // Legacy signature is retained only as an adapter to the authenticated context.
  async save(entity: Student): Promise<void>;
  async save(arg1: SecurityContext | Student, arg2?: Partial<Student>): Promise<Student | void> {
    if (arg2 !== undefined) {
      return super.save(arg1 as SecurityContext, this.normalize(arg2));
    }
    const context = this.currentContext();
    return super.save(context, this.normalize(arg1 as Student));
  }

  async findById(id: string, tenantId: string): Promise<Student | null> {
    return (await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<Student[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async findByClass(classId: string, tenantId: string): Promise<Student[]> {
    return await this.table.where('classId').equals(classId).filter(s => s.tenantId === tenantId).toArray();
  }

  /**
   * Canonical student create path: Service → Repository → BaseRepository → Dexie + SyncQueue.
   */
  async create(entity: Student): Promise<void> {
    await super.save(this.currentContext(), this.normalize(entity));
  }

  /**
   * Canonical student update path: Service → Repository → BaseRepository → Dexie + SyncQueue.
   */
  async update(entity: Student): Promise<void> {
    await super.save(this.currentContext(), this.normalize(entity));
  }

  /**
   * Canonical student delete path: Service → Repository → BaseRepository → Dexie + SyncQueue.
   */
  async delete(id: string, tenantId: string): Promise<void> {
    const context = this.currentContext();
    if (!context.isDeveloper && context.tenantId !== tenantId) {
      throw new Error(`TENANT_ACCESS_DENIED: '${tenantId}' !== '${context.tenantId}'.`);
    }
    await super.delete(context, id);
  }

  async refresh(_tenantId: string): Promise<void> {
    // Sync logic is owned by SyncEngine; repository remains local-only.
  }

  // --- BUSINESS-SPECIFIC READ METHODS ---

  async findByQrCode(tenantId: string, qrCode: string): Promise<Student | null> {
    const student = await this.table.get(qrCode);
    if (!student || student.tenantId !== tenantId) return null;
    return student;
  }

  async getByClassId(tenantId: string, classId: string): Promise<Student[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((s) => s.classId === classId)
      .toArray();
  }

  async searchByName(tenantId: string, query: string): Promise<Student[]> {
    return await this.table
      .where('tenantId')
      .equals(tenantId)
      .filter((s) => s.namaLengkap.toLowerCase().includes(query.toLowerCase()))
      .limit(20)
      .toArray();
  }

  async fetchByUserId(tenantId: string, userId: string): Promise<Student | null> {
    return (
      (await this.table
        .where('tenantId')
        .equals(tenantId)
        .filter((s) => s.linkedUserId === userId || s.userUid === userId || s.authUid === userId)
        .first()) || null
    );
  }

  async getByTenant(tenantId: string): Promise<Student[]> {
    return await this.findAll(tenantId);
  }

  async fetchByTenant(tenantId: string, limitVal?: number): Promise<Student[]> {
    const q = this.table.where('tenantId').equals(tenantId);
    return limitVal ? q.limit(limitVal).toArray() : q.toArray();
  }

  async fetchByIdUnik(tenantId: string, idUnik: string): Promise<Student | null> {
    const student = await this.table.get(idUnik);
    if (!student || student.tenantId !== tenantId) return null;
    return student;
  }

  async fetchByNisn(tenantId: string, nisn: string): Promise<Student | null> {
    return (
      (await this.table
        .where('tenantId')
        .equals(tenantId)
        .filter((s) => s.nisn === nisn)
        .first()) || null
    );
  }

  async deleteLocal(id: string, tenantId: string): Promise<void> {
    await this.delete(id, tenantId);
  }

  async updateFirestore(id: string, tenantId: string, data: Partial<Student>): Promise<void> {
    const current = await this.findById(id, tenantId);
    if (current) await this.update({ ...current, ...data });
  }

  async bulkImport(students: Student[]): Promise<void> {
    const context = this.currentContext();
    await this.saveBatch(context, students.map((student) => this.normalize(student)));
  }

  async fetchPaginated(tenantId: string, _lastDoc: any, pageSize: number, filter?: any): Promise<any> {
    let q = this.table.where('tenantId').equals(tenantId);
    if (filter?.class && filter.class !== 'All') {
      q = q.filter((s) => s.classId === filter.class || s.className === filter.class);
    }
    const data = await q.limit(pageSize).toArray();
    return { data, lastDoc: null };
  }

  async moveToArchive(id: string, tenantId: string, _target: string, reason: string, status: string): Promise<void> {
    const s = await this.findById(id, tenantId);
    if (s) await this.update({ ...s, status: status as any, archiveReason: reason } as any);
  }

  async promoteBatch(ids: string[], tenantId: string, updateData: any): Promise<void> {
    const students = await Promise.all(ids.map((id) => this.findById(id, tenantId)));
    const changes = students.filter(Boolean).map((student) => ({ ...student!, ...updateData }));
    if (changes.length) await this.bulkImport(changes);
  }

  async getInvalidStudents(tenantId: string): Promise<Student[]> {
    return await this.table.where("tenantId").equals(tenantId).filter((s) => !s.namaLengkap || !s.idUnik).toArray();
  }
}

export const studentRepository = new StudentRepository();

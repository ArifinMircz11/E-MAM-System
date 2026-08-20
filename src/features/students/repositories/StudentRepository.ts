import { BaseRepository } from '@/repositories/base/BaseRepository';
import type { Student } from '@/types';
import type { SecurityContext } from '@/core/security/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from '@/repositories/SyncRepository';

/**
 * StudentRepository
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class StudentRepository extends BaseRepository<Student> {
  constructor() {
    super('students');
  }

  // Override save to ensure student index fields are not undefined
  async save(context: SecurityContext, entity: Partial<Student>): Promise<Student>;
  async save(entity: Student): Promise<void>;
  async save(arg1: SecurityContext | Student, arg2?: Partial<Student>): Promise<Student | void> {
    if (arg2 !== undefined) {
      const entity = arg2;
      entity.status = (entity.status || 'Aktif') as any;
      entity.classId = entity.classId || '';
      entity.idUnik = entity.idUnik || entity.id || '';
      return super.save(arg1 as SecurityContext, entity);
    }
    const entity = arg1 as Student;
    entity.status = (entity.status || 'Aktif') as any;
    entity.classId = entity.classId || '';
    entity.idUnik = entity.idUnik || entity.id || '';
    return super.save(entity);
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

  async create(entity: Student): Promise<void> {
    const dataToSave = {
      ...entity,
      idUnik: entity.idUnik || entity.id,
      status: entity.status || 'Aktif',
      classId: entity.classId || '',
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'students',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: Student): Promise<void> {
    const dataToSave = {
      ...entity,
      idUnik: entity.idUnik || entity.id,
      status: entity.status || 'Aktif',
      classId: entity.classId || '',
      syncStatus: 'pending' as any,
      updatedAt: Date.now(),
    };
    const dbInstance = (this.table as any).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'students',
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
      await this.table.where('id').equals(id).filter(s => s.tenantId === tenantId).delete();
      await syncRepository.enqueue({
        collection: 'students',
        action: 'DELETE',
        payload: { id },
        tenantId: tenantId,
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  // --- BUSINESS-SPECIFIC METHODS ---

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
    if (limitVal) {
      return await q.limit(limitVal).toArray();
    }
    return await q.toArray();
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
    if (current) {
      await this.update({ ...current, ...data });
    }
  }

  async bulkImport(students: Student[]): Promise<void> {
    for (const s of students) {
      await this.update(s);
    }
  }

  async fetchPaginated(tenantId: string, lastDoc: any, pageSize: number, filter?: any): Promise<any> {
    let q = this.table.where('tenantId').equals(tenantId);
    if (filter?.class && filter.class !== 'All') {
      q = q.filter((s) => s.classId === filter.class || s.className === filter.class);
    }
    const data = await q.limit(pageSize).toArray();
    return { data, lastDoc: null };
  }

  async moveToArchive(id: string, tenantId: string, target: string, reason: string, status: string): Promise<void> {
    const s = await this.findById(id, tenantId);
    if (s) {
      await this.update({ ...s, status: status as any, archiveReason: reason } as any);
    }
  }

  async promoteBatch(ids: string[], tenantId: string, updateData: any): Promise<void> {
    for (const id of ids) {
      const s = await this.findById(id, tenantId);
      if (s) {
        await this.update({ ...s, ...updateData });
      }
    }
  }

  async getInvalidStudents(tenantId: string): Promise<Student[]> {
    return await this.table.where("tenantId").equals(tenantId).filter((s) => !s.namaLengkap || !s.idUnik).toArray();
  }
}
export const studentRepository = new StudentRepository();

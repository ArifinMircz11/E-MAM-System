import { BaseRepository } from './BaseRepository';
import { localDb } from '@/database/dexie';

export interface StudentParentRelation {
  id: string;
  tenantId: string;
  studentId: string;
  parentId: string;
  relationship: string;
  createdAt: number;
}

export class StudentParentRepository extends BaseRepository<StudentParentRelation> {
  constructor() {
    super('student_parents');
  }

  async getByParentId(tenantId: string, parentId: string): Promise<StudentParentRelation[]> {
    return await this.table
      .where('[tenantId+parentId]')
      .equals([tenantId, parentId])
      .toArray();
  }

  async getByStudentId(tenantId: string, studentId: string): Promise<StudentParentRelation[]> {
    return await this.table
      .where('[tenantId+studentId]')
      .equals([tenantId, studentId])
      .toArray();
  }

  async create(entity: StudentParentRelation): Promise<void> {
    await this.table.add(entity);
    // Relationship is synchronized to Firestore
    await localDb.sync_queue.add({
      id: `sq_${Date.now()}_${entity.id}`,
      tenantId: entity.tenantId,
      collection: 'studentParents',
      recordId: entity.id,
      operation: 'create',
      payload: entity,
      createdAt: Date.now(),
      status: 'pending',
      attempts: 0,
    });
  }
}

export const studentParentRepository = new StudentParentRepository();

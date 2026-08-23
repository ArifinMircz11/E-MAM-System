import { BaseRepository } from './BaseRepository';
import { syncRepository } from './SyncRepository';

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
    await syncRepository.enqueue({
      tenantId: entity.tenantId,
      collection: 'studentParents',
      action: 'CREATE',
      payload: entity,
    });
  }
}

export const studentParentRepository = new StudentParentRepository();

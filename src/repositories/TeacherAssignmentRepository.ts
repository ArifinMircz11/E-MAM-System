import { BaseRepository } from './BaseRepository';
import type { TeacherAssignment } from '@/domain/entities/schedule';
import type { SecurityContext } from '@/core/security/types';

export class TeacherAssignmentRepository extends BaseRepository<TeacherAssignment> {
  constructor() {
    super('teacher_assignments');
  }

  async fetchByTenant(context: SecurityContext, tenantId: string): Promise<TeacherAssignment[]> {
    this.validateContext(context, 'fetchByTenant');
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async findByTeacher(context: SecurityContext, tenantId: string, teacherId: string): Promise<TeacherAssignment[]> {
    this.validateContext(context, 'findByTeacher');
    return await this.table.where('[tenantId+teacherId]').equals([tenantId, teacherId]).toArray();
  }

  async findByClass(context: SecurityContext, tenantId: string, classId: string): Promise<TeacherAssignment[]> {
    this.validateContext(context, 'findByClass');
    return await this.table.where('[tenantId+classId]').equals([tenantId, classId]).toArray();
  }
}

export const teacherAssignmentRepository = new TeacherAssignmentRepository();

/**
 * @license
 * e-Mam System - Teacher Attendance Repository
 * LAYER: REPOSITORY (Architecture Compliant)
 */

import { BaseRepository } from './base/BaseRepository';
import type { TeacherAttendanceRecord } from '@/types';
import type { SecurityContext } from '@/core/context/TenantContext';
import { localDb } from '@/database/dexie';

/**
 * TeacherAttendanceRepository
 *
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced via BaseRepository and SecurityContext.
 */
export class TeacherAttendanceRepository extends BaseRepository<TeacherAttendanceRecord> {

  async findById(id: string, tenantId: string): Promise<TeacherAttendanceRecord | null> {
    return (await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<TeacherAttendanceRecord[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: TeacherAttendanceRecord): Promise<void> {
    await this.table.add(entity);
  }

  async update(entity: TeacherAttendanceRecord): Promise<void> {
    await this.table.put(entity);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.table.where('id').equals(id).filter(e => e.tenantId === tenantId).delete();
  }

  async refresh(tenantId: string): Promise<void> {}

  /**
   * Retrieves teacher attendance for a specific teacher today.
   */
  async getByTeacherToday(
    context: SecurityContext,
    teacherId: string,
  ): Promise<TeacherAttendanceRecord | null> {
    const today = new Date().toISOString().split('T')[0];
    return (await this.table.where('[teachersId+date]').equals([teacherId, today]).first()) || null;
  }

  /**
   * Retrieves teacher attendance for a tenant and date.
   */
  async getLocalByTenantAndDate(
    context: SecurityContext,
    date: string,
  ): Promise<TeacherAttendanceRecord[]> {
    return await this.table
      .where('tenantId')
      .equals(context.tenantId)
      .filter((r) => r.date === date)
      .toArray();
  }
}

export const teacherAttendanceRepository = new TeacherAttendanceRepository();

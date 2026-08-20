import { BaseRepository } from './BaseRepository';
import type { Student } from '@/types';
import type { SecurityContext } from '@/core/security/types';

/**
 * ProfileRepository
 * Handles local Dexie operations for student profile completion and updates,
 * automatically integrating with SyncRepository via BaseRepository.
 */
export class ProfileRepository extends BaseRepository<Student> {
  constructor() {
    super('students');
  }

  async getByStudentId(context: SecurityContext, studentId: string): Promise<Student | null> {
    return await this.getById(context, studentId);
  }

  async updateProfile(context: SecurityContext, studentId: string, data: Partial<Student>): Promise<Student> {
    const existing = await this.getById(context, studentId);
    if (!existing) {
      throw new Error(`Student record not found for ID: ${studentId}`);
    }
    return await this.save(context, {
      ...existing,
      ...data,
      approvalStatus: 'pending',
      status: 'pending_data_approval',
    });
  }
}

export const profileRepository = new ProfileRepository();

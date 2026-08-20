import { profileRepository } from '@/repositories/ProfileRepository';
import { userRepository } from '@/repositories/userRepository';
import { getSecurityContext } from '@/core/security/contextHelper';
import type { Student } from '@/types';

/**
 * ProfileService
 * Central business logic layer for profile completion and updates,
 * following offline-first architecture (UI -> Hook -> Service -> Repository -> Dexie).
 */
export class ProfileService {
  async getStudentData(studentId: string): Promise<Student | null> {
    if (!studentId) return null;
    try {
      const context = getSecurityContext();
      return await profileRepository.getByStudentId(context, studentId);
    } catch (err) {
      console.error('[ProfileService] getStudentData error:', err);
      return null;
    }
  }

  async getUserData(uid: string): Promise<any | null> {
    if (!uid) return null;
    try {
      const context = getSecurityContext();
      return await userRepository.getByUid(uid);
    } catch (err) {
      console.error('[ProfileService] getUserData error:', err);
      return null;
    }
  }

  async updateProfile(studentId: string, formData: Record<string, string>): Promise<Student> {
    const context = getSecurityContext();
    return await profileRepository.updateProfile(context, studentId, formData);
  }
}

export const profileService = new ProfileService();

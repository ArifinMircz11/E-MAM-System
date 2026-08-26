import { userRepository } from '@/repositories/userRepository';
import { CanonicalUser } from '@/identity/domain/CanonicalUser';

export const updateProfile = async (userId: string, data: Partial<CanonicalUser>) => {
  return await userRepository.update(userId, data);
};

export const getProfile = async (userId: string) => {
  return await userRepository.getById(userId);
};

export const ProfileService = {
  updateProfile,
  getProfile,
};

export const profileService = ProfileService;

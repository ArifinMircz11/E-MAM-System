import { CanonicalUser } from '@/identity/domain/CanonicalUser';
import { userRepository } from '@/repositories/userRepository';

export interface IdentityValidationResult {
  valid: boolean;
  missingFields: string[];
}

export class IdentityCompletionService {
  static validate(user: CanonicalUser | null | undefined): IdentityValidationResult {
    if (!user) {
      return { valid: true, missingFields: [] };
    }
    
    // Developer or Guest accounts are exempt
    if (user.role === 'developer' || (user.roles && user.roles.includes('developer' as any))) {
      return { valid: true, missingFields: [] };
    }

    const missingFields: string[] = [];
    if (!user.displayName || user.displayName.trim() === '') {
      missingFields.push('displayName');
    }
    if (!user.tenantId || user.tenantId.trim() === '') {
      missingFields.push('tenantId');
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  static async completeProfile(userId: string, data: Partial<CanonicalUser>): Promise<boolean> {
    try {
      await userRepository.update(userId, {
        ...data,
        updatedAt: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const identityCompletionService = IdentityCompletionService;

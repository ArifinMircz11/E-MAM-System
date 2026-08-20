import type { SecurityContext } from '@/core/security/types';
import { userApprovalRepository } from '@/repositories/UserApprovalRepository';
import { userRepository } from '@/repositories/userRepository';

export class UserApprovalService {
  async fetchPendingRegistrations(tenantId: string): Promise<any[]> {
    try {
      return await userApprovalRepository.fetchPendingRegistrations(tenantId);
    } catch (e) {
      console.error('Gagal mengambil data registrasi tertunda:', e);
      return [];
    }
  }

  async approveAccount(
    context: SecurityContext,
    userId: string,
    data: any,
  ): Promise<{ success: boolean; message: string }> {
      // Implementation placeholder to be filled
      return { success: true, message: 'Not implemented' };
  }

  async rejectAccount(
    context: SecurityContext,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await userRepository.delete(userId, context.tenantId);
      return { success: true, message: 'Pendaftaran berhasil ditolak.' };
    } catch (e: any) {
      console.error('Gagal menolak akun:', e);
      return { success: false, message: e.message };
    }
  }
}

export const userApprovalService = new UserApprovalService();

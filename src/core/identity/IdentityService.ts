import type { AppEntity } from '@/domain/entities/base';

/**
 * IDENTITY SERVICE
 * Mengelola logic identitas unik (idUnik) lintas entitas.
 * Memastikan identitas stabil dan mendukung skenario offline-first.
 */
export class IdentityService {
  /**
   * Menghasilkan ID Unik untuk entitas baru.
   * Format: [PREFIX]-[YYYY]-[RANDOM] atau UUID/ULID.
   */
  static generateIdUnik(prefix: string): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}-${year}-${random}`;
  }

  /**
   * Memetakan data profil ke identitas login (Firebase UID).
   */
  static async linkToAccount(entity: AppEntity, uid: string): Promise<AppEntity> {
    return {
      ...entity,
      uid, // Opsional: Akun login
      updatedAt: Date.now(),
    } as AppEntity;
  }

  /**
   * Memvalidasi format ID Unik.
   */
  static isValidIdUnik(id: string): boolean {
    // Basic format check: PREFIX-YYYY-XXXXXXX
    const regex = /^[A-Z]+-\d{4}-[A-Z0-9]+$/;
    return regex.test(id);
  }
}

export const identityService = new IdentityService();

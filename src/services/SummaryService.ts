/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: SERVICE (SUMMARY ENGINE)
 * Enterprise-Grade Summary Management with Offline-First Support
 */

import { summaryRepository } from '@/repositories/summaryRepository';
import { UserRole } from '@/types';

export class SummaryService {
  /**
   * Mendapatkan data ringkasan secara lokal (Dexie)
   */
  static async getSummary(tenantId: string, type: string): Promise<any> {
    return await summaryRepository.getByType(tenantId, type);
  }

  /**
   * Memperbarui ringkasan secara lokal dan menjadwalkan sinkronisasi jika perlu
   * Catatan: Biasanya aggregation berat dilakukan di Cloud (Cloud Functions),
   * namun client dapat melakukan optimistik update.
   */
  static async updateSummaryLocally(tenantId: string, type: string, data: any): Promise<void> {
    await summaryRepository.save(tenantId, type, data);
  }

  /**
   * Menghitung ulang statistik dasar (misal: jumlah siswa per rombel)
   * Dilakukan di client-side untuk responsivitas dashboard offline.
   */
  static async refreshBasicStats(tenantId: string): Promise<void> {
    // Implementasi refresh statistik dasar dari data lokal Dexie
    console.log(`[SummaryService] Refreshing basic stats for tenant ${tenantId}...`);
  }
}

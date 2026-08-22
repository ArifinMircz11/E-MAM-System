import { localDb } from '@/database/dexie';
import type { AssignmentRequestData, KanwilDashboardSummary, SatuanKerjaData } from '@/features/kanwil/types';

/**
 * Operational repository for the Kanwil workspace.
 * Services consume this repository; Dexie remains the operational source of truth.
 */
export class KanwilDashboardRepository {
  async getSummary(): Promise<KanwilDashboardSummary> {
    const [madrasahList, usersList] = await Promise.all([localDb.madrasah.toArray(), localDb.users.toArray()]);
    const [pendingAssignments, activeNotifications] = await Promise.all([
      localDb.approval_requests.filter((item: any) => String(item.status || '').toUpperCase() === 'PENDING').count(),
      localDb.notifications.filter((item: any) => item.isRead === false || item.isRead === 0).count(),
    ]);

    let totalMA = 0;
    let totalMTs = 0;
    let totalMI = 0;
    for (const madrasah of madrasahList as any[]) {
      const jenjang = String(madrasah.jenjang || madrasah.level || '').toUpperCase();
      if (jenjang === 'MA' || jenjang.includes('ALIYAH')) totalMA++;
      else if (jenjang === 'MTS' || jenjang.includes('TSANAWIYAH')) totalMTs++;
      else if (jenjang === 'MI' || jenjang.includes('IBTIDAIYAH')) totalMI++;
    }

    return {
      totalSatuanKerjaKabKota: await localDb.satuan_kerja.where('type').equals('KANKENAG_KAB_KOTA').count(),
      totalMA,
      totalMTs,
      totalMI,
      totalMadrasah: madrasahList.length,
      totalUsers: usersList.length,
      pendingAssignments,
      activeNotifications,
      syncStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'synced' : 'offline',
      lastSyncedAt: Date.now(),
    };
  }

  async getSatuanKerjaList(): Promise<SatuanKerjaData[]> { return await localDb.satuan_kerja.toArray() as SatuanKerjaData[]; }
  async createSatuanKerja(entity: SatuanKerjaData): Promise<void> { await localDb.satuan_kerja.add(entity); }
  async updateSatuanKerja(id: string, changes: Partial<SatuanKerjaData>): Promise<void> { await localDb.satuan_kerja.update(id, changes); }
  async deleteSatuanKerja(id: string): Promise<void> { await localDb.satuan_kerja.delete(id); }
  async createAssignmentRequest(request: AssignmentRequestData): Promise<void> { await localDb.approval_requests.add(request); }
}

export const kanwilDashboardRepository = new KanwilDashboardRepository();

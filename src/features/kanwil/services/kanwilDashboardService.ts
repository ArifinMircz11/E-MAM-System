import { kanwilDashboardRepository } from '@/repositories/KanwilDashboardRepository';
import { syncRepository } from '@/repositories/SyncRepository';
import type { AssignmentRequestData, KanwilDashboardSummary, SatuanKerjaData } from '../types';

export class KanwilDashboardService {
  static async getSummary(): Promise<KanwilDashboardSummary> {
    return kanwilDashboardRepository.getSummary();
  }

  static async getSatuanKerjaList(): Promise<SatuanKerjaData[]> {
    return kanwilDashboardRepository.getSatuanKerjaList();
  }

  static async createSatuanKerja(
    data: Omit<SatuanKerjaData, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const now = Date.now();
    const id = `SK-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const entity: SatuanKerjaData = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };
    await kanwilDashboardRepository.createSatuanKerja(entity);
    await syncRepository.enqueue({
      collection: 'satuan_kerja',
      recordId: id,
      operation: 'create',
      payload: entity,
    });
    return id;
  }

  static async updateSatuanKerja(id: string, data: Partial<SatuanKerjaData>): Promise<void> {
    const updatedAt = Date.now();
    const payload = { id, ...data, updatedAt };
    await kanwilDashboardRepository.updateSatuanKerja(id, {
      ...data,
      updatedAt,
      syncStatus: 'modified',
    });
    await syncRepository.enqueue({
      collection: 'satuan_kerja',
      recordId: id,
      operation: 'update',
      payload,
    });
  }

  static async deleteSatuanKerja(id: string): Promise<void> {
    await kanwilDashboardRepository.deleteSatuanKerja(id);
    await syncRepository.enqueue({
      collection: 'satuan_kerja',
      recordId: id,
      operation: 'delete',
      payload: { id },
    });
  }

  static async submitAssignmentRequest(requestPayload: AssignmentRequestData): Promise<void> {
    await kanwilDashboardRepository.createAssignmentRequest(requestPayload);
    await syncRepository.enqueue({
      collection: 'approval_requests',
      recordId: requestPayload.id,
      operation: 'create',
      payload: requestPayload,
    });
  }
}

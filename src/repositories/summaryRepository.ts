/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: REPOSITORY (DEXIE)
 */

import { localDb } from '@/database/dexie';

export interface SummaryData {
  id: string;
  tenantId: string;
  type: string; // e.g., 'student_gender_stats'
  data: any;
  updatedAt: number;
}

export const summaryRepository = {
  async getByType(tenantId: string, type: string): Promise<any | null> {
    const record = await localDb.table('summaries')
      .where('[tenantId+type]')
      .equals([tenantId, type])
      .first();
    return record ? record.data : null;
  },

  async save(tenantId: string, type: string, data: any): Promise<void> {
    const id = `${type}_${tenantId}`;
    await localDb.table('summaries').put({
      id,
      tenantId,
      type,
      data,
      updatedAt: Date.now()
    });
  }
};

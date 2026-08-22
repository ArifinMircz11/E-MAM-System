/**
 * @license
 * e-Mam System - Point Sync Service
 * LAYER: SERVICE (Sync Boundary)
 */

import { firestoreGateway as dbGateway } from '@/services/gateways/FirestoreGateway';
import { getDocsSafe, getDocSafe } from './firestoreHelpers';
import { pointCategoryRepository } from '@/repositories/PointCategoryRepository';
import { pointSummaryRepository } from '@/repositories/PointSummaryRepository';
import type { PointCategory } from '@/types';

const CAT_COL = 'point_categories';
const SUM_COL = 'student_point_summaries';

export const pointSyncService = {
  async fetchCategories(tenantId: string): Promise<PointCategory[]> {
    const q = dbGateway.query(dbGateway.collection(dbGateway.db, CAT_COL), dbGateway.where('tenantId', '==', tenantId));
    const data = (await getDocsSafe<PointCategory>(q)) || [];
    for (const cat of data) await pointCategoryRepository.update(cat as any);
    return data;
  },

  async fetchSummaries(tenantId: string, className?: string, max = 100): Promise<any[]> {
    let q = dbGateway.query(dbGateway.collection(dbGateway.db, SUM_COL), dbGateway.where('tenantId', '==', tenantId), dbGateway.orderBy('totalPoints', 'desc'), dbGateway.limit(max));
    if (className && className !== 'Semua' && className !== 'All') q = dbGateway.query(q, dbGateway.where('class', '==', className));
    const data = (await getDocsSafe<any>(q)) || [];
    for (const sum of data) await pointSummaryRepository.update(sum);
    return data;
  },

  async fetchStudentPoints(tenantId: string, studentId: string, max = 50): Promise<any[]> {
    const q = dbGateway.query(dbGateway.collection(dbGateway.db, 'points'), dbGateway.where('tenantId', '==', tenantId), dbGateway.where('studentsId', '==', studentId), dbGateway.orderBy('date', 'desc'), dbGateway.limit(max));
    return (await getDocsSafe<any>(q)) || [];
  },

  async fetchSummary(studentId: string): Promise<any | null> {
    const result = await getDocSafe<any>(dbGateway.doc(dbGateway.db, SUM_COL, studentId));
    if (result) await pointSummaryRepository.update(result);
    return result;
  },
};

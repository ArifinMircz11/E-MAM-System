/**
 * @license
 * e-Mam System - Point Sync Service
 * LAYER: SERVICE (Sync Boundary)
 */

import { db as firestore } from '@/services/firebase';
import { firestoreGateway as dbGateway } from '@/services/gateways/FirestoreGateway';
import { getDocsSafe, getDocSafe } from './firestoreHelpers';
import { pointCategoryRepository } from '@/repositories/PointCategoryRepository';
import { pointSummaryRepository } from '@/repositories/PointSummaryRepository';
import type { PointCategory } from '@/types';
import { TenantContext } from '@/core/context/TenantContext';

const CAT_COL = 'point_categories';
const SUM_COL = 'student_point_summaries';

export const pointSyncService = {
  async fetchCategories(tenantId: string): Promise<PointCategory[]> {
    const context = TenantContext.getContext();
    const q = dbGateway.query(dbGateway.collection(firestore, CAT_COL), dbGateway.where('tenantId', '==', tenantId));
    const results = await getDocsSafe<PointCategory>(q);
    const data = results || [];
    for (const cat of data) {
      await pointCategoryRepository.update(cat as any);
    }
    return data;
  },

  async fetchSummaries(tenantId: string, className?: string, max = 100): Promise<any[]> {
    const context = TenantContext.getContext();
    let q = dbGateway.query(
      dbGateway.collection(firestore, SUM_COL),
      dbGateway.where('tenantId', '==', tenantId),
      dbGateway.orderBy('totalPoints', 'desc'),
      dbGateway.limit(max),
    );

    if (className && className !== 'Semua' && className !== 'All') {
      q = dbGateway.query(q, dbGateway.where('class', '==', className));
    }

    const results = await getDocsSafe<any>(q);
    const data = results || [];
    for (const sum of data) {
      await pointSummaryRepository.update(sum);
    }
    return data;
  },

  async fetchStudentPoints(tenantId: string, studentId: string, max = 50): Promise<any[]> {
    const q = dbGateway.query(
      dbGateway.collection(firestore, 'points'), // Corrected to 'points'
      dbGateway.where('tenantId', '==', tenantId),
      dbGateway.where('studentsId', '==', studentId),
      dbGateway.orderBy('date', 'desc'), // Corrected field
      dbGateway.limit(max),
    );
    const results = await getDocsSafe<any>(q);
    const data = results || [];
    return data;
  },

  async fetchSummary(studentId: string): Promise<any | null> {
    const context = TenantContext.getContext();
    const docRef = dbGateway.doc(firestore, SUM_COL, studentId);
    const result = await getDocSafe<any>(docRef);
    if (result) {
      await pointSummaryRepository.update(result);
    }
    return result;
  },
};

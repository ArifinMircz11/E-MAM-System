/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: SERVICE (AGGREGATION ENGINE)
 * Zero-Waste Architecture: Hemat Quota Firestore via Summary Document
 */

import { summaryRepository } from '@/repositories/summaryRepository';

const SUMMARY_COL = 'summaries';
const GENDER_DOC = 'student_gender_stats';

export interface GenderStats {
  [rombel: string]: {
    male: number;
    female: number;
    total: number;
  };
}

/**
 * Mendapatkan ringkasan gender siswa tanpa query massal (Offline-First)
 */
export const getStudentGenderStats = async (tenantId: string): Promise<GenderStats> => {
  try {
    const data = await summaryRepository.getByType(tenantId, GENDER_DOC);
    return data || {};
  } catch (e) {
    console.error('[studentAggregateService] Failed to fetch gender stats from local storage:', e);
    return {};
  }
};

/**
 * Update statistik gender secara atomis saat ada perubahan data siswa (Local-First)
 */
export const updateGenderAggregate = async (
  tenantId: string,
  rombel: string,
  gender: 'L' | 'P' | string,
  change: 1 | -1,
) => {
  try {
    const current = await summaryRepository.getByType(tenantId, GENDER_DOC) || {};
    const genderKey = gender === 'L' || gender.toUpperCase().startsWith('LAKI') ? 'male' : 'female';
    
    if (!current[rombel]) {
      current[rombel] = { male: 0, female: 0, total: 0 };
    }
    
    current[rombel][genderKey] = (current[rombel][genderKey] || 0) + change;
    current[rombel].total = (current[rombel].total || 0) + change;
    
    await summaryRepository.save(tenantId, GENDER_DOC, current);
  } catch (e) {
    console.warn('[studentAggregateService] Local aggregate update failed:', e);
  }
};

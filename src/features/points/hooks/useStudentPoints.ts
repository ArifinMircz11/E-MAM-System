/**
 * @license
 * e-Mam System - Student Points Individual Hook
 * LAYER: HOOK (Architecture Compliant)
 */

import { useState, useEffect, useCallback } from 'react';
import { usePointIndividualStore } from '../stores/pointIndividualStore';
import { PointReportService } from '../services/PointReportService';
import type { StudentIndividualReport } from '../types/pointReport';
import { useAutoFix } from '@/hooks/useAutoFix';

export const useStudentPoints = () => {
  const { selectedStudentId, selectedStudentData, activeSubTab } =
    usePointIndividualStore((state) => ({
      selectedStudentId: state.selectedStudentId,
      selectedStudentData: state.selectedStudentData,
      activeSubTab: state.activeSubTab,
    }));

  const { safeCall } = useAutoFix();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<StudentIndividualReport | null>(null);

  const fetchStudentReport = useCallback(async () => {
    if (!selectedStudentId) {
      setReport(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await safeCall(async () => {
        const res = await PointReportService.getStudentIndividualReport(
          selectedStudentId,
        );
        setReport(res);
      }, 'useStudentPoints.fetchReport');
    } catch (err: any) {
      console.error('[useStudentPoints] fetch error:', err);
      setError(err.message || 'Gagal memuat rekap poin individu');
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId, safeCall]);

  useEffect(() => {
    fetchStudentReport();
  }, [fetchStudentReport]);

  return {
    selectedStudentId,
    selectedStudentData,
    activeSubTab,
    loading,
    error,
    report,
    refreshReport: fetchStudentReport,
  };
};

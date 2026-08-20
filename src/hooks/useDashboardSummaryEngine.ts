import { useState, useEffect, useCallback } from 'react';
import { DashboardSummaryEngine } from '@/services/DashboardSummaryEngine';
import type { DashboardSummaryEntity } from '@/repositories/DashboardSummaryRepository';

export const useDashboardSummaryEngine = () => {
  const [summary, setSummary] = useState<DashboardSummaryEntity>({
    id: '',
    tenantId: '',
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    attendanceRateToday: 0,
    totalViolations: 0,
    totalAchievements: 0,
    updatedAt: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const data = await DashboardSummaryEngine.getSummary(force);
      setSummary(data);
      setError(null);
    } catch (err: any) {
      console.error('[useDashboardSummaryEngine] Error loading summary:', err);
      setError(err?.message || 'Failed to load dashboard summary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(false);
  }, [loadSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshSummary: () => loadSummary(true),
  };
};

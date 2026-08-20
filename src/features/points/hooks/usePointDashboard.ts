/**
 * @license
 * e-Mam System - Point Dashboard Custom Hook
 * LAYER: HOOK (Architecture Compliant)
 */

import { useState, useEffect, useCallback } from 'react';
import { usePointDashboardStore } from '../stores/pointDashboardStore';
import { PointReportService } from '../services/PointReportService';
import type {
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
  ClassReportData,
} from '../types/pointReport';
import { useAutoFix } from '@/hooks/useAutoFix';

export const usePointDashboard = () => {
  const filters = usePointDashboardStore((state) => ({
    period: state.period,
    selectedDate: state.selectedDate,
    selectedClassId: state.selectedClassId,
    startDate: state.startDate,
    endDate: state.endDate,
    transactionType: state.transactionType,
    categoryId: state.categoryId,
    searchQuery: state.searchQuery,
  }));

  const { safeCall } = useAutoFix();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [dailyData, setDailyData] = useState<DailyReportData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyReportData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReportData | null>(null);
  const [classData, setClassData] = useState<ClassReportData | null>(null);

  const refreshReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await safeCall(async () => {
        if (filters.period === 'daily') {
          const res = await PointReportService.getDailySummary(
            filters.selectedDate,
            filters.selectedClassId,
          );
          setDailyData(res);
        } else if (filters.period === 'weekly') {
          const res = await PointReportService.getWeeklySummary(
            filters.startDate,
            filters.endDate,
            filters.selectedClassId,
          );
          setWeeklyData(res);
        } else if (filters.period === 'monthly') {
          const monthYear = filters.selectedDate.substring(0, 7);
          const res = await PointReportService.getMonthlySummary(
            monthYear,
            filters.selectedClassId,
          );
          setMonthlyData(res);
        } else if (filters.period === 'class') {
          const targetClass =
            filters.selectedClassId === 'All' ? '10 A' : filters.selectedClassId;
          const res = await PointReportService.getClassSummary(targetClass);
          setClassData(res);
        }
      }, 'usePointDashboard.refresh');
    } catch (err: any) {
      console.error('[usePointDashboard] fetch error:', err);
      setError(err.message || 'Gagal memuat rekap poin');
    } finally {
      setLoading(false);
    }
  }, [
    filters.period,
    filters.selectedDate,
    filters.selectedClassId,
    filters.startDate,
    filters.endDate,
    safeCall,
  ]);

  useEffect(() => {
    refreshReport();
  }, [refreshReport]);

  return {
    period: filters.period,
    loading,
    error,
    dailyData,
    weeklyData,
    monthlyData,
    classData,
    refreshReport,
  };
};

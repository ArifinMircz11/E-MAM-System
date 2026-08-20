import { useState, useEffect, useCallback, useRef } from 'react';
import type { StudentDashboardData } from '../types';
import { getStudentDashboardData } from '../services/studentDashboardService';
import { useUserStore } from '@/stores/userStore';
import { useAutoFix } from '@/hooks/useAutoFix';

export const useStudentDashboard = () => {
  const referenceId = useUserStore((state) => state.referenceId);
  const { safeCall } = useAutoFix();

  const [data, setData] = useState<StudentDashboardData>({
    profile: null,
    attendanceToday: null,
    pointSummary: null,
    schedulesToday: [],
    activePermission: null,
    notif: [],
    letters: [],
    news: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to always track latest data state in stable helper callbacks
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchData = useCallback(async () => {
    if (!referenceId) return;

    // Only show global loading spinner if we don't have cached data yet
    if (!dataRef.current.profile) {
      setIsLoading(true);
    }

    await safeCall(async () => {
      const result = await getStudentDashboardData(referenceId, '');
      setData(result);
    }, 'StudentDashboard.Fetch');
    setIsLoading(false);
  }, [referenceId, safeCall]);

  useEffect(() => {
    fetchData();
  }, [referenceId, fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
};

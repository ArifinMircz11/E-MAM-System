// src/hooks/useStudentAttendance.ts
import { useState, useEffect, useMemo } from 'react';
import { getAttendanceByStudentId } from '@/features/attendance/services/attendanceService';
import { getStudentPointsHistory, getStudentPointSummary } from '@/services/pointService';
import type { PointRecord } from '@/types';
import { useAutoFix } from './useAutoFix';
import { useAuthStore } from '@/stores/authStore';
import {
  calculateAttendanceStats,
  mapRawAttendanceToRecord,
} from '../utils/attendanceCalculations'; // Importing the utility

export const useStudentAttendance = (id: string | undefined) => {
  const { safeCall } = useAutoFix();
  const currentUser = useAuthStore((state) => state.user);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id && !currentUser?.idUnik && !currentUser?.studentsId) return;

    const loadData = async () => {
      const targetId = id || currentUser?.idUnik || currentUser?.studentsId || '';
      if (!targetId) return;

      setLoading(true);

      // Parallel network fetch using Firestore (automatic memory caching active)
      const [attendance, points, pointSummary] = await Promise.all([
        safeCall(() => getAttendanceByStudentId(targetId), 'StudentAttendance.fetchAttendance'),
        safeCall(() => getStudentPointsHistory(targetId), 'StudentAttendance.fetchPoints'),
        safeCall(() => getStudentPointSummary(targetId), 'StudentAttendance.fetchSummary'),
      ]);

      if (attendance && (attendance as any[]).length > 0) {
        const mapped = (attendance as any[])
          .map((rec) => mapRawAttendanceToRecord(rec))
          .filter(Boolean);
        setAttendanceRecords(mapped);
      } else if (currentUser?.studentsId && targetId !== currentUser.studentsId) {
        // Secondary attempt if initial ID attempt was empty
        const fallbackAtt = await safeCall(
          () => getAttendanceByStudentId(currentUser.studentsId!),
          'StudentAttendance.fetchAttendanceFallback',
        );
        if (fallbackAtt) {
          const mapped = (fallbackAtt as any[])
            .map((rec) => mapRawAttendanceToRecord(rec))
            .filter(Boolean);
          setAttendanceRecords(mapped);
        }
      }

      if (points) setPointRecords(points as any as PointRecord[]);
      if (pointSummary) setSummary(pointSummary);

      setLoading(false);
    };

    loadData();
  }, [id, currentUser?.idUnik, currentUser?.studentsId, safeCall]);

  const stats = useMemo(() => calculateAttendanceStats(attendanceRecords), [attendanceRecords]);

  return {
    attendanceRecords,
    pointRecords,
    summary,
    stats,
    loading,
  };
};

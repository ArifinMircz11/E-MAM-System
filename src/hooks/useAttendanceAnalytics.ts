/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: HOOKS - ATTENDANCE & POINTS ANALYTICS
 */

import { useState, useEffect, useMemo } from 'react';
import { isMockMode } from '@/services/authService';
import type { AttendanceRecord, PointRecord as StudentPointRecord } from '@/types';
import type {
  AttendanceStats} from '../utils/attendanceCalculations';
import {
  calculateAttendanceStats,
  calculatePercentage
} from '../utils/attendanceCalculations';
import { getAttendanceByStudentId } from '@/features/attendance/services/attendanceService';
import { pointRepository } from '@/repositories/PointRepository';
import { TenantContext } from '@/core/context/TenantContext';

export const useAttendanceAnalytics = (
  studentId: string | undefined,
  selectedMonth: string, // Format: 'yyyy-MM'
) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [pointRecords, setPointRecords] = useState<StudentPointRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    if (isMockMode) {
      // Mock mode data handling remains here...
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const context = TenantContext.getContext();

        // Fetch attendance via attendanceService pipeline
        const allAttendance = await getAttendanceByStudentId(studentId);
        const filteredAttendance = allAttendance.filter((r) =>
          r.tanggal?.startsWith(selectedMonth),
        );
        filteredAttendance.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

        // Fetch points
        const allPoints = await pointRepository.getByStudent(studentId);
        const filteredPoints = allPoints.filter(
          (p) => p.date?.startsWith(selectedMonth) || (p as any).tanggal?.startsWith(selectedMonth),
        );
        filteredPoints.sort((a, b) => {
          const dateA = a.date || (a as any).tanggal || '';
          const dateB = b.date || (b as any).tanggal || '';
          return dateB.localeCompare(dateA);
        });

        if (isMounted) {
          setAttendanceRecords(filteredAttendance);
          setPointRecords(filteredPoints as unknown as StudentPointRecord[]);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useAttendanceAnalytics] Error fetching data:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [studentId, selectedMonth]);

  // Compute stats
  const stats = useMemo<AttendanceStats>(() => {
    return calculateAttendanceStats(attendanceRecords);
  }, [attendanceRecords]);

  // Compute percentage
  const attendancePercentage = useMemo<number>(() => {
    return calculatePercentage(stats);
  }, [stats]);

  // Total achievement index points
  const pointsTotals = useMemo(() => {
    let prestasi = 0;
    let pelanggaran = 0;
    pointRecords.forEach((p) => {
      const pointsVal = Number(p.points || 0);
      if (p.type === 'Prestasi') {
        prestasi += Math.abs(pointsVal);
      } else if (p.type === 'Pelanggaran') {
        pelanggaran += Math.abs(pointsVal);
      }
    });
    return {
      prestasi,
      pelanggaran,
      net: prestasi - pelanggaran,
    };
  }, [pointRecords]);

  return {
    attendanceRecords,
    pointRecords,
    stats,
    attendancePercentage,
    pointsTotals,
    loading,
  };
};

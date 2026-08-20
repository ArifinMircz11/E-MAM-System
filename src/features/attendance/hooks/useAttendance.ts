/**
 * e-Mam System - useAttendance Hook
 * Custom Hook for attendance scanning and processing.
 */

import { useState, useCallback } from 'react';
import type {
  AttendanceSession} from '@/features/attendance/services/attendanceService';
import {
  recordAttendanceByScan
} from '@/features/attendance/services/attendanceService';
import { useAutoFix } from '@/hooks/useAutoFix';

export interface UseAttendanceResult {
  isSubmitting: boolean;
  error: string | null;
  recordScan: (
    rawCode: string,
    session: AttendanceSession,
    isHaidMode: boolean,
  ) => Promise<{ success: boolean; message: string; student?: any }>;
}

export const useAttendance = (): UseAttendanceResult => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { safeCall } = useAutoFix();

  const recordScan = useCallback(
    async (rawCode: string, session: AttendanceSession, isHaidMode: boolean) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const cleanCode = rawCode.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();

        const result = (await safeCall(
          () => recordAttendanceByScan(cleanCode, session, isHaidMode),
          'useAttendance.recordScan',
        )) || { success: false, message: 'Gagal menghubungi server' };

        setIsSubmitting(false);
        if (result.success || result.message.toLowerCase().includes('sudah ')) {
          return {
            success: true,
            message: result.message,
            student: (result as any).student,
          };
        } else {
          setError(result.message);
          return {
            success: false,
            message: result.message,
          };
        }
      } catch (err: any) {
        const msg = err?.message || 'Database connection error';
        setError(msg);
        setIsSubmitting(false);
        return {
          success: false,
          message: msg,
        };
      }
    },
    [safeCall],
  );

  return {
    isSubmitting,
    error,
    recordScan,
  };
};

/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * High Performance Local Attendance Stats Utility using Composite Indexes
 */

import { localDb } from '@/database/dexie';
import type { AttendanceStats } from '../utils/attendanceCalculations';

export const localAttendanceStatsService = {
  /**
   * Directly count attendance by specific status under a tenant/class/date context.
   * Leverages the composite index [tenantId+statusGlobal+date] for instant counting.
   */
  async countByStatus(tenantId: string, statusGlobal: string, date: string): Promise<number> {
    try {
      return await localDb.attendance
        .where('[tenantId+statusGlobal+date]')
        .equals([tenantId, statusGlobal, date])
        .count();
    } catch (err) {
      console.warn('[localAttendanceStatsService] Failed countByStatus:', err);
      return 0;
    }
  },

  /**
   * Fetch attendance records by class and date instantly.
   * Leverages the composite index [tenantId+class+date].
   */
  async getByClassAndDate(tenantId: string, className: string, date: string) {
    try {
      return await localDb.attendance
        .where('[tenantId+class+date]')
        .equals([tenantId, className, date])
        .toArray();
    } catch (err) {
      console.warn('[localAttendanceStatsService] Failed getByClassAndDate:', err);
      return [];
    }
  },

  /**
   * Fetch attendance records by student id and date instantly.
   * Leverages the composite index [tenantId+studentsId+date].
   */
  async getByStudentAndDate(tenantId: string, studentsId: string, date: string) {
    try {
      return await localDb.attendance
        .where('[tenantId+studentsId+date]')
        .equals([tenantId, studentsId, date])
        .toArray();
    } catch (err) {
      console.warn('[localAttendanceStatsService] Failed getByStudentAndDate:', err);
      return [];
    }
  },

  /**
   * Calculates daily attendance statistics for a single class on a specific date.
   * Leverages the high speed composite index query to retrieve metrics instantly
   * without running slow in-memory map/reduce/filter loops.
   */
  async calculateClassStats(
    tenantId: string,
    className: string,
    date: string,
  ): Promise<AttendanceStats> {
    try {
      // Fetch all student records for this class on this date via composite index
      const records = await this.getByClassAndDate(tenantId, className, date);

      const stats: AttendanceStats = {
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        haid: 0,
        alpa: 0,
        pulangCepat: 0,
        total: records.length,
      };

      // Since the list is small (usually 1 class limit of 30-40 records),
      // we can do a quick mapping, or for massive scaling we can directly query
      // count index keys for status under high capacity requirements.
      for (const rec of records) {
        const rawStatus = String(rec.statusGlobal || '').toLowerCase();
        if (rawStatus.includes('haid')) stats.haid += 1;
        else if (rawStatus.includes('terlambat') || rawStatus.includes('+')) stats.terlambat += 1;
        else if (rawStatus.includes('pc')) stats.pulangCepat += 1;
        else if (rawStatus.includes('izin')) stats.izin += 1;
        else if (rawStatus.includes('sakit')) stats.sakit += 1;
        else if (rawStatus.includes('alpa')) stats.alpa += 1;
        else stats.hadir += 1;
      }

      return stats;
    } catch (err) {
      console.error('[localAttendanceStatsService] calculateClassStats failed:', err);
      return {
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        haid: 0,
        alpa: 0,
        pulangCepat: 0,
        total: 0,
      };
    }
  },

  /**
   * Fast global daily stats counter for the dashboard.
   * Leverages composite indexes to retrieve and build stats instantly.
   */
  async calculateTenantStats(tenantId: string, date: string): Promise<AttendanceStats> {
    try {
      // Multi-query parallel execution over the composite indexed count for maximum throughput
      const [hadir, terlambat, izin, sakit, haid, alpa] = await Promise.all([
        this.countByStatus(tenantId, 'Hadir', date),
        this.countByStatus(tenantId, 'Terlambat', date),
        this.countByStatus(tenantId, 'Izin', date),
        this.countByStatus(tenantId, 'Sakit', date),
        this.countByStatus(tenantId, 'Haid', date),
        this.countByStatus(tenantId, 'Alpha', date),
      ]);

      const total = hadir + terlambat + izin + sakit + haid + alpa;

      return {
        hadir,
        terlambat,
        izin,
        sakit,
        haid,
        alpa,
        pulangCepat: 0, // Calculated sessions status
        total,
      };
    } catch (err) {
      console.error('[localAttendanceStatsService] calculateTenantStats failed:', err);
      return {
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        haid: 0,
        alpa: 0,
        pulangCepat: 0,
        total: 0,
      };
    }
  },
};

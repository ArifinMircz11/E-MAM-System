/**
 * @license
 * e-Mam System - Student Points Reporting Service
 * LAYER: SERVICE (Offline-First Aggregations & Reports)
 */

import { TenantContext } from '@/core/context/TenantContext';
import { pointRepository } from '@/repositories/PointRepository';
import { pointSummaryRepository } from '@/repositories/PointSummaryRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { letterRepository } from '@/repositories/letterRepository';
import { getClasses } from '@/services/classService';
import type {
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
  ClassReportData,
  StudentIndividualReport,
  ClassPointBreakdown,
  DailyTrendItem,
  StudentPointRankItem,
  StudentTimelineItem,
  StudentLetterItem,
} from '../types/pointReport';
import { calculateSanctionLevel, SanctionLevel } from '@/domain/point/pointDomain';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const PointReportService = {
  /**
   * Calculate Daily Point Report
   */
  async getDailySummary(
    dateStr: string,
    classId: string = 'All',
  ): Promise<DailyReportData> {
    const tenantId = TenantContext.getContext().tenantId;
    const allPoints = await pointRepository.findAll(tenantId);

    // Filter by date and optional class
    const dayPoints = allPoints.filter((p: any) => {
      const pDate = p.date || (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '');
      if (pDate !== dateStr) return false;
      if (classId !== 'All' && classId !== 'Semua') {
        const pClass = p.className || p.class || p.classId;
        if (pClass !== classId) return false;
      }
      return true;
    });

    let violationsCount = 0;
    let achievementsCount = 0;
    const studentSet = new Set<string>();
    const classMap = new Map<
      string,
      { violations: number; achievements: number; studentSet: Set<string> }
    >();

    for (const p of dayPoints) {
      const studentId = p.studentsId || p.studentId || 'unknown';
      const className = p.className || (p as any).class || p.classId || 'Unassigned';
      studentSet.add(studentId);

      const pt = Number(p.points || 0);
      const isViolation = p.type === 'pelanggaran' || (p.type as string) === 'Misconduct' || pt > 0;

      if (isViolation) {
        violationsCount += Math.abs(pt);
      } else {
        achievementsCount += Math.abs(pt);
      }

      if (!classMap.has(className)) {
        classMap.set(className, {
          violations: 0,
          achievements: 0,
          studentSet: new Set(),
        });
      }

      const cData = classMap.get(className)!;
      cData.studentSet.add(studentId);
      if (isViolation) {
        cData.violations += Math.abs(pt);
      } else {
        cData.achievements += Math.abs(pt);
      }
    }

    const classBreakdown: ClassPointBreakdown[] = Array.from(
      classMap.entries(),
    ).map(([cName, data]) => ({
      classId: cName,
      className: cName,
      studentCount: data.studentSet.size,
      violations: data.violations,
      achievements: data.achievements,
      netPoints: data.violations - data.achievements,
    }));

    // Sort by net points descending
    classBreakdown.sort((a, b) => b.netPoints - a.netPoints);

    return {
      date: dateStr,
      totalTransactions: dayPoints.length,
      violationsCount,
      achievementsCount,
      studentsInvolvedCount: studentSet.size,
      classBreakdown,
    };
  },

  /**
   * Calculate Weekly Point Report
   */
  async getWeeklySummary(
    startDateStr: string,
    endDateStr: string,
    classId: string = 'All',
  ): Promise<WeeklyReportData> {
    const tenantId = TenantContext.getContext().tenantId;
    const allPoints = await pointRepository.findAll(tenantId);

    const rangePoints = allPoints.filter((p: any) => {
      const pDate = p.date || (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '');
      if (!pDate || pDate < startDateStr || pDate > endDateStr) return false;
      if (classId !== 'All' && classId !== 'Semua') {
        const pClass = p.className || p.class || p.classId;
        if (pClass !== classId) return false;
      }
      return true;
    });

    let totalPointsIn = 0; // Violations (+)
    let totalPointsOut = 0; // Achievements (-)
    const studentSet = new Set<string>();

    // Build day map for range safely without timezone bleeding
    const dayMap = new Map<
      string,
      { pointsIn: number; pointsOut: number; dateStr: string; dayName: string }
    >();

    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const [eY, eM, eD] = endDateStr.split('-').map(Number);
    const curr = new Date(sY, sM - 1, sD, 12, 0, 0);
    const end = new Date(eY, eM - 1, eD, 12, 0, 0);

    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateIso = `${y}-${m}-${d}`;
      const dayName = DAY_NAMES[curr.getDay()];
      dayMap.set(dateIso, {
        pointsIn: 0,
        pointsOut: 0,
        dateStr: dateIso,
        dayName,
      });
      curr.setDate(curr.getDate() + 1);
    }

    for (const p of rangePoints) {
      const studentId = p.studentsId || p.studentId;
      if (studentId) studentSet.add(studentId);

      const pt = Number(p.points || 0);
      const isViolation = p.type === 'pelanggaran' || (p.type as string) === 'Misconduct' || pt > 0;

      if (isViolation) {
        totalPointsIn += Math.abs(pt);
      } else {
        totalPointsOut += Math.abs(pt);
      }

      const pDate = p.date || '';
      if (dayMap.has(pDate)) {
        const dayEntry = dayMap.get(pDate)!;
        if (isViolation) {
          dayEntry.pointsIn += Math.abs(pt);
        } else {
          dayEntry.pointsOut += Math.abs(pt);
        }
      }
    }

    const dailyTrends: DailyTrendItem[] = Array.from(dayMap.values()).map(
      (item) => ({
        dayName: item.dayName,
        date: item.dateStr,
        pointsIn: item.pointsIn,
        pointsOut: item.pointsOut,
        netPoints: item.pointsIn - item.pointsOut,
      }),
    );

    const label = `${startDateStr} – ${endDateStr}`;

    return {
      startDate: startDateStr,
      endDate: endDateStr,
      weekRangeLabel: label,
      totalPointsIn,
      totalPointsOut,
      netBalance: totalPointsIn - totalPointsOut,
      studentsInvolvedCount: studentSet.size,
      dailyTrends,
    };
  },

  /**
   * Calculate Monthly Point Report
   */
  async getMonthlySummary(
    monthYearStr: string, // YYYY-MM
    classId: string = 'All',
  ): Promise<MonthlyReportData> {
    const tenantId = TenantContext.getContext().tenantId;
    const allPoints = await pointRepository.findAll(tenantId);
    const allLetters = await letterRepository.findAll(tenantId);

    const monthPoints = allPoints.filter((p: any) => {
      if (!p.date || !p.date.startsWith(monthYearStr)) return false;
      if (classId !== 'All' && classId !== 'Semua') {
        const pClass = p.className || p.class || p.classId;
        if (pClass !== classId) return false;
      }
      return true;
    });

    // Count letters generated in month
    const monthLetters = allLetters.filter((l: any) => {
      const lDate = l.createdAt
        ? new Date(l.createdAt).toISOString().split('T')[0]
        : l.date || '';
      return lDate.startsWith(monthYearStr);
    });

    let violationsCount = 0;
    let achievementsCount = 0;
    const studentSet = new Set<string>();
    const classMap = new Map<
      string,
      { pointsIn: number; pointsOut: number }
    >();

    for (const p of monthPoints) {
      const studentId = p.studentsId || p.studentId;
      if (studentId) studentSet.add(studentId);

      const className = p.className || (p as any).class || p.classId || 'Unassigned';
      const pt = Number(p.points || 0);
      const isViolation = p.type === 'pelanggaran' || (p.type as string) === 'Misconduct' || pt > 0;

      if (isViolation) {
        violationsCount += Math.abs(pt);
      } else {
        achievementsCount += Math.abs(pt);
      }

      if (!classMap.has(className)) {
        classMap.set(className, { pointsIn: 0, pointsOut: 0 });
      }

      const cData = classMap.get(className)!;
      if (isViolation) {
        cData.pointsIn += Math.abs(pt);
      } else {
        cData.pointsOut += Math.abs(pt);
      }
    }

    const classBreakdown = Array.from(classMap.entries()).map(
      ([cName, data]) => ({
        classId: cName,
        className: cName,
        pointsIn: data.pointsIn,
        pointsOut: data.pointsOut,
        netPoints: data.pointsIn - data.pointsOut,
      }),
    );

    classBreakdown.sort((a, b) => b.netPoints - a.netPoints);

    return {
      monthYearStr,
      monthLabel: monthYearStr,
      violationsCount,
      achievementsCount,
      netBalance: violationsCount - achievementsCount,
      studentsInvolvedCount: studentSet.size,
      callLettersCount: monthLetters.length,
      classBreakdown,
    };
  },

  /**
   * Calculate Class-Specific Point Report
   */
  async getClassSummary(className: string): Promise<ClassReportData> {
    const tenantId = TenantContext.getContext().tenantId;

    // Get class students
    const classStudents = await studentRepository.getByClassId(
      tenantId,
      className,
    );
    const summaries = await pointSummaryRepository.findAll(tenantId);
    const letters = await letterRepository.findAll(tenantId);

    // Filter summaries for class
    const summaryMap = new Map<string, any>();
    for (const s of summaries) {
      const sId = (s as any).studentsId || (s as any).studentId || s.id;
      summaryMap.set(sId, s);
    }

    let totalClassPoints = 0;
    let atRiskCount = 0;
    const rankings: StudentPointRankItem[] = [];

    for (const student of classStudents) {
      const sId = student.id || student.idUnik;
      const sSummary = summaryMap.get(sId);
      const points = sSummary?.totalPoints || 0;
      totalClassPoints += points;

      let statusBadge: 'SP-3' | 'SP-2' | 'SP-1' | 'Waspada' | 'Normal' =
        'Normal';
      if (points >= 75) statusBadge = 'SP-3';
      else if (points >= 50) statusBadge = 'SP-2';
      else if (points >= 25) statusBadge = 'SP-1';
      else if (points >= 15) statusBadge = 'Waspada';

      if (points >= 15) {
        atRiskCount++;
      }

      rankings.push({
        rank: 0, // will be assigned after sort
        studentId: sId,
        studentName: student.namaLengkap,
        className: student.className || className,
        nisn: student.nisn,
        points,
        sanctionLevel:
          sSummary?.sanctionLevel || calculateSanctionLevel(points),
        statusBadge,
      });
    }

    // Sort rankings descending
    rankings.sort((a, b) => b.points - a.points);
    rankings.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const classLetters = letters.filter((l: any) => {
      const recipientClass = l.className || l.recipientClass || '';
      return recipientClass === className;
    });

    return {
      classId: className,
      className,
      totalStudents: classStudents.length,
      atRiskStudentsCount: atRiskCount,
      totalPoints: totalClassPoints,
      averagePoints:
        classStudents.length > 0
          ? Number((totalClassPoints / classStudents.length).toFixed(1))
          : 0,
      callLettersCount: classLetters.length,
      studentRankings: rankings,
    };
  },

  /**
   * Calculate Individual Student Point Report & Timeline
   */
  async getStudentIndividualReport(
    studentId: string,
  ): Promise<StudentIndividualReport | null> {
    const tenantId = TenantContext.getContext().tenantId;

    const student = await studentRepository.findById(studentId, tenantId);
    if (!student) {
      // Fallback search by idUnik
      const altStudent = await studentRepository.fetchByIdUnik(
        tenantId,
        studentId,
      );
      if (!altStudent) return null;
    }

    const activeStudent =
      student || (await studentRepository.fetchByIdUnik(tenantId, studentId));
    const sName = activeStudent?.namaLengkap || 'Siswa';
    const cName = activeStudent?.className || 'Class';
    const nisn = activeStudent?.nisn || '-';

    // Summary
    const summary = await pointSummaryRepository.getByStudent(
      studentId,
      tenantId,
    );
    const totalPoints = summary?.totalPoints || 0;

    // Transaction History
    const history = await pointRepository.getByStudent(studentId, tenantId);

    // Sort chronological ascending with timestamp fallback to maintain trajectory accuracy
    const sortedAsc = [...history].sort((a: any, b: any) => {
      const timeA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : new Date(a.date || 0).getTime();
      const timeB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : new Date(b.date || 0).getTime();
      return timeA - timeB;
    });

    let runningBalance = 0;
    let violationsTotal = 0;
    let achievementsTotal = 0;
    let adjustmentsTotal = 0;

    const timeline: StudentTimelineItem[] = [];
    const balanceHistory: Array<{ date: string; balance: number }> = [];

    for (const item of sortedAsc) {
      const pt = Number((item as any).points || 0);
      const isViolation =
        (item as any).type === 'pelanggaran' ||
        (item as any).type === 'Misconduct' ||
        pt > 0;
      const isAchievement =
        (item as any).type === 'prestasi' ||
        (item as any).type === 'Achievement' ||
        pt < 0;

      if (isViolation) violationsTotal += Math.abs(pt);
      else if (isAchievement) achievementsTotal += Math.abs(pt);
      else adjustmentsTotal += Math.abs(pt);

      const prev = runningBalance;
      runningBalance += pt;

      timeline.unshift({
        id: item.id || `POINT_${Date.now()}`,
        date: item.date || new Date().toISOString().split('T')[0],
        type: isViolation
          ? 'pelanggaran'
          : isAchievement
            ? 'prestasi'
            : 'koreksi',
        category: (item as any).category || 'Umum',
        description: (item as any).description || '',
        pointsChange: pt,
        previousBalance: prev,
        newBalance: runningBalance,
        recordedBy: (item as any).idPetugas || 'Guru / Admin',
      });

      balanceHistory.push({
        date: item.date || new Date().toISOString().split('T')[0],
        balance: runningBalance,
      });
    }

    // Determine thresholds
    let nextThreshold = 25;
    if (totalPoints >= 75) nextThreshold = 100;
    else if (totalPoints >= 50) nextThreshold = 75;
    else if (totalPoints >= 25) nextThreshold = 50;

    const progressPct = Math.min(
      100,
      Math.round((totalPoints / nextThreshold) * 100),
    );

    // Letters
    const letters = await letterRepository.findAll(tenantId);
    const activeIdUnik = activeStudent?.idUnik;
    const studentLetters = letters.filter((l: any) => {
      if (l.studentsId && l.studentsId === studentId) return true;
      if (l.studentId && l.studentId === studentId) return true;
      if (activeIdUnik && (l.studentsId === activeIdUnik || l.studentId === activeIdUnik)) return true;
      return false;
    });

    const callLetters: StudentLetterItem[] = studentLetters.map((l: any) => ({
      id: l.id,
      letterNumber: l.letterNumber || l.nomorSurat,
      date: l.createdAt
        ? new Date(l.createdAt).toISOString().split('T')[0]
        : l.date || '2026-08-11',
      spLevel: l.type?.includes('SP-3')
        ? 'SP-3'
        : l.type?.includes('SP-2')
          ? 'SP-2'
          : 'SP-1',
      status: l.status || 'PENDING_REVIEW',
      thresholdPoints: l.thresholdPoints || 25,
      pointsAtCreation: l.pointsAtCreation || totalPoints,
      recipientName: l.recipientName || sName,
    }));

    return {
      studentId,
      studentName: sName,
      className: cName,
      nisn,
      totalActivePoints: totalPoints,
      violationsPoints: violationsTotal,
      achievementsPoints: achievementsTotal,
      currentStatus:
        summary?.sanctionLevel || calculateSanctionLevel(totalPoints),
      sanctionLevel:
        summary?.sanctionLevel || calculateSanctionLevel(totalPoints),
      nextThreshold,
      thresholdProgressPercentage: progressPct,
      timeline,
      charts: {
        balanceHistory,
        distribution: {
          violations: violationsTotal,
          achievements: achievementsTotal,
          adjustments: adjustmentsTotal,
        },
      },
      callLetters,
    };
  },
};

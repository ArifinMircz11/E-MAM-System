import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EMamDatabase } from '@/core/database/db';
import { pointRepository } from '@/repositories/PointRepository';
import { pointSummaryRepository } from '@/repositories/PointSummaryRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { letterRepository } from '@/repositories/letterRepository';
import { PointReportService } from '@/features/points/services/PointReportService';
import { TenantContext } from '@/core/context/TenantContext';
import { SanctionLevel, calculateSanctionLevel } from '@/domain/point/pointDomain';

import { useUserStore } from '@/stores/userStore';

describe('Reporting Verification Gate (R1 - R12): Point Reporting UI & Aggregation Engine', () => {
  let testDb: EMamDatabase;

  const tenantA = 'TENANT-ALPHA-REP';
  const tenantB = 'TENANT-BETA-REP';

  const studentA1 = 'STUDENT-A1';
  const studentA2 = 'STUDENT-A2';
  const studentB1 = 'STUDENT-B1';

  beforeEach(async () => {
    // 1. Setup isolated Dexie DB instance
    testDb = new EMamDatabase('Test_PointsReporting_' + Math.random().toString(36).substring(7));
    await testDb.open();

    // 2. Redirect Repositories to testDb tables
    (pointRepository as any).table = testDb.points;
    (pointSummaryRepository as any).table = testDb.student_point_summaries;
    (studentRepository as any).table = testDb.students;
    (letterRepository as any).table = testDb.letters;

    // 3. Set Tenant Context to Tenant A via UserStore
    useUserStore.setState({
      tenantId: tenantA,
      uid: 'user-admin',
      roles: ['admin'],
      accountType: 'admin',
      permissions: ['*'],
      email: 'admin@test.com',
    } as any);

    // 4. Seed initial students
    await (studentRepository as any).table.bulkAdd([
      {
        id: studentA1,
        idUnik: studentA1,
        tenantId: tenantA,
        namaLengkap: 'Siswa A1 (Ahmad)',
        className: '10-A',
        classId: '10-A',
        nisn: '00112233',
        status: 'Aktif',
      },
      {
        id: studentA2,
        idUnik: studentA2,
        tenantId: tenantA,
        namaLengkap: 'Siswa A2 (Budi)',
        className: '10-A',
        classId: '10-A',
        nisn: '00112234',
        status: 'Aktif',
      },
      {
        id: studentB1,
        idUnik: studentB1,
        tenantId: tenantB,
        namaLengkap: 'Siswa B1 (Chandra)',
        className: '10-A',
        classId: '10-A',
        nisn: '00998877',
        status: 'Aktif',
      },
    ]);
  });

  afterEach(async () => {
    if (testDb && testDb.isOpen()) {
      await testDb.delete();
    }
  });

  it('Gate R1: Daily Report - Only aggregates transactions occurring on specific date', async () => {
    // Seed point transactions across 2 dates
    await (pointRepository as any).table.bulkAdd([
      {
        id: 'P1',
        tenantId: tenantA,
        studentsId: studentA1,
        studentName: 'Siswa A1 (Ahmad)',
        className: '10-A',
        points: 10,
        type: 'pelanggaran',
        category: 'Kedisiplinan',
        description: 'Terlambat',
        date: '2026-08-11',
        createdAt: new Date('2026-08-11T07:15:00').getTime(),
      },
      {
        id: 'P2',
        tenantId: tenantA,
        studentsId: studentA2,
        studentName: 'Siswa A2 (Budi)',
        className: '10-A',
        points: 5,
        type: 'pelanggaran',
        category: 'Kedisiplinan',
        description: 'Baju Seragam',
        date: '2026-08-11',
        createdAt: new Date('2026-08-11T08:00:00').getTime(),
      },
      {
        id: 'P3',
        tenantId: tenantA,
        studentsId: studentA1,
        studentName: 'Siswa A1 (Ahmad)',
        className: '10-A',
        points: 15,
        type: 'pelanggaran',
        category: 'Kedisiplinan',
        description: 'Bolos',
        date: '2026-08-12',
        createdAt: new Date('2026-08-12T09:00:00').getTime(),
      },
    ]);

    const dailyReport = await PointReportService.getDailySummary('2026-08-11');

    expect(dailyReport.date).toBe('2026-08-11');
    expect(dailyReport.totalTransactions).toBe(2);
    expect(dailyReport.violationsCount).toBe(15);
    expect(dailyReport.achievementsCount).toBe(0);
    expect(dailyReport.studentsInvolvedCount).toBe(2);
  });

  it('Gate R2: Weekly Report - Aggregates date range (Mon-Sun) without timezone bleeding', async () => {
    await (pointRepository as any).table.bulkAdd([
      {
        id: 'P_MON',
        tenantId: tenantA,
        studentsId: studentA1,
        className: '10-A',
        points: 10,
        type: 'pelanggaran',
        category: 'Disiplin',
        description: 'Mon Violation',
        date: '2026-08-10',
        createdAt: new Date('2026-08-10T08:00:00').getTime(),
      },
      {
        id: 'P_SUN',
        tenantId: tenantA,
        studentsId: studentA1,
        className: '10-A',
        points: 5,
        type: 'pelanggaran',
        category: 'Disiplin',
        description: 'Sun Violation',
        date: '2026-08-16',
        createdAt: new Date('2026-08-16T18:00:00').getTime(),
      },
    ]);

    const weeklyReport = await PointReportService.getWeeklySummary('2026-08-10', '2026-08-16');

    expect(weeklyReport.totalPointsIn).toBe(15);
    expect(weeklyReport.netBalance).toBe(15);
    expect(weeklyReport.dailyTrends.length).toBe(7);

    const mondayItem = weeklyReport.dailyTrends.find((d) => d.date === '2026-08-10');
    expect(mondayItem?.pointsIn).toBe(10);

    const sundayItem = weeklyReport.dailyTrends.find((d) => d.date === '2026-08-16');
    expect(sundayItem?.pointsIn).toBe(5);
  });

  it('Gate R3: Monthly Report - Month filtering and Call Letters aggregation', async () => {
    await (pointRepository as any).table.bulkAdd([
      {
        id: 'P_AUG',
        tenantId: tenantA,
        studentsId: studentA1,
        className: '10-A',
        points: 20,
        type: 'pelanggaran',
        category: 'Disiplin',
        description: 'Aug Violation',
        date: '2026-08-11',
      },
      {
        id: 'P_SEP',
        tenantId: tenantA,
        studentsId: studentA1,
        className: '10-A',
        points: 50,
        type: 'pelanggaran',
        category: 'Disiplin',
        description: 'Sep Violation',
        date: '2026-09-01',
      },
    ]);

    await (letterRepository as any).table.add({
      id: 'LTR_1',
      tenantId: tenantA,
      studentsId: studentA1,
      recipientName: 'Siswa A1 (Ahmad)',
      type: 'SP-1',
      status: 'ISSUED',
      createdAt: new Date('2026-08-12T10:00:00').getTime(),
    });

    const monthlyReport = await PointReportService.getMonthlySummary('2026-08');

    expect(monthlyReport.monthYearStr).toBe('2026-08');
    expect(monthlyReport.violationsCount).toBe(20);
    expect(monthlyReport.callLettersCount).toBe(1);
  });

  it('Gate R4: Class Report - Student rankings and dynamic sanction level mapping', async () => {
    // Seed point summaries for students
    await (pointSummaryRepository as any).table.bulkAdd([
      {
        id: studentA1,
        tenantId: tenantA,
        studentsId: studentA1,
        studentName: 'Siswa A1 (Ahmad)',
        totalPoints: 30,
        sanctionLevel: SanctionLevel.PANGGILAN_1,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: studentA2,
        tenantId: tenantA,
        studentsId: studentA2,
        studentName: 'Siswa A2 (Budi)',
        totalPoints: 10,
        sanctionLevel: SanctionLevel.AMAN,
        lastUpdate: new Date().toISOString(),
      },
    ]);

    const classReport = await PointReportService.getClassSummary('10-A');

    expect(classReport.className).toBe('10-A');
    expect(classReport.totalStudents).toBe(2);
    expect(classReport.totalPoints).toBe(40);
    expect(classReport.averagePoints).toBe(20);
    expect(classReport.atRiskStudentsCount).toBe(1); // 30 points >= 15

    expect(classReport.studentRankings[0].studentId).toBe(studentA1);
    expect(classReport.studentRankings[0].rank).toBe(1);
    expect(classReport.studentRankings[0].statusBadge).toBe('SP-1'); // 30 points -> SP-1
  });

  it('Gate R5 & Gate R6: Individual Report - Ledger Trajectory & Student Isolation', async () => {
    // Add ledger entries for studentA1 in chronological order
    await (pointRepository as any).table.bulkAdd([
      {
        id: 'LEDGER_1',
        tenantId: tenantA,
        studentsId: studentA1,
        points: 10,
        type: 'pelanggaran',
        category: 'Disiplin',
        description: 'Awal (+10)',
        date: '2026-08-10',
        createdAt: new Date('2026-08-10T07:00:00').getTime(),
      },
      {
        id: 'LEDGER_2',
        tenantId: tenantA,
        studentsId: studentA1,
        points: 15,
        type: 'pelanggaran',
        category: 'Disiplin',
        description: 'Lanjutan (+15)',
        date: '2026-08-11',
        createdAt: new Date('2026-08-11T08:00:00').getTime(),
      },
    ]);

    await (pointSummaryRepository as any).table.add({
      id: studentA1,
      tenantId: tenantA,
      studentsId: studentA1,
      studentName: 'Siswa A1 (Ahmad)',
      totalPoints: 25,
      sanctionLevel: calculateSanctionLevel(25),
      lastUpdate: new Date().toISOString(),
    });

    const report = await PointReportService.getStudentIndividualReport(studentA1);

    expect(report).not.toBeNull();
    expect(report?.studentId).toBe(studentA1);
    expect(report?.totalActivePoints).toBe(25);
    expect(report?.sanctionLevel).toBe(SanctionLevel.PANGGILAN_1);

    // Verify timeline unshifted order (most recent top)
    expect(report?.timeline.length).toBe(2);
    const topItem = report?.timeline[0];
    const firstItem = report?.timeline[1];

    expect(firstItem?.previousBalance).toBe(0);
    expect(firstItem?.pointsChange).toBe(10);
    expect(firstItem?.newBalance).toBe(10);

    expect(topItem?.previousBalance).toBe(10);
    expect(topItem?.pointsChange).toBe(15);
    expect(topItem?.newBalance).toBe(25);
  });

  it('Gate R7: Achievement / Deductions handling in net calculations', async () => {
    await (pointRepository as any).table.bulkAdd([
      {
        id: 'VIOLATION_1',
        tenantId: tenantA,
        studentsId: studentA1,
        points: 20,
        type: 'pelanggaran',
        category: 'Ketertiban',
        description: 'Pelanggaran (+20)',
        date: '2026-08-10',
        createdAt: new Date('2026-08-10T08:00:00').getTime(),
      },
      {
        id: 'PRESTASI_1',
        tenantId: tenantA,
        studentsId: studentA1,
        points: -10,
        type: 'prestasi',
        category: 'Prestasi',
        description: 'Juara Lomba (-10)',
        date: '2026-08-11',
        createdAt: new Date('2026-08-11T09:00:00').getTime(),
      },
    ]);

    const report = await PointReportService.getStudentIndividualReport(studentA1);

    expect(report?.violationsPoints).toBe(20);
    expect(report?.achievementsPoints).toBe(10);

    // Check timeline trajectory balance
    const newestItem = report?.timeline[0];
    expect(newestItem?.pointsChange).toBe(-10);
    expect(newestItem?.previousBalance).toBe(20);
    expect(newestItem?.newBalance).toBe(10);
  });

  it('Gate R8: Charts Data matches timeline balance without secondary Dexie table', async () => {
    await (pointRepository as any).table.add({
      id: 'P_CHART_1',
      tenantId: tenantA,
      studentsId: studentA1,
      points: 15,
      type: 'pelanggaran',
      category: 'Disiplin',
      description: 'Poin Chart',
      date: '2026-08-11',
      createdAt: new Date('2026-08-11T10:00:00').getTime(),
    });

    const report = await PointReportService.getStudentIndividualReport(studentA1);

    expect(report?.charts.balanceHistory).toBeDefined();
    expect(report?.charts.balanceHistory.length).toBe(1);
    expect(report?.charts.balanceHistory[0].balance).toBe(15);
  });

  it('Gate R9: Call Letters Tab retrieves actual student letters with valid status', async () => {
    await (letterRepository as any).table.add({
      id: 'LTR_ALPHA_SP1',
      tenantId: tenantA,
      studentsId: studentA1,
      recipientName: 'Siswa A1 (Ahmad)',
      letterNumber: 'SP/001/2026',
      type: 'SP-1',
      status: 'APPROVED',
      createdAt: new Date('2026-08-12T11:00:00').getTime(),
    });

    const report = await PointReportService.getStudentIndividualReport(studentA1);

    expect(report?.callLetters.length).toBe(1);
    expect(report?.callLetters[0].letterNumber).toBe('SP/001/2026');
    expect(report?.callLetters[0].spLevel).toBe('SP-1');
    expect(report?.callLetters[0].status).toBe('APPROVED');
  });

  it('Gate R10: Multi-Tenant Isolation - Tenant B data cannot leak into Tenant A reports', async () => {
    // Add point for Student B1 under Tenant B
    await (pointRepository as any).table.add({
      id: 'P_TENANT_B',
      tenantId: tenantB,
      studentsId: studentB1,
      points: 50,
      type: 'pelanggaran',
      category: 'Kehadiran',
      description: 'Bolos Tenant B',
      date: '2026-08-11',
      createdAt: new Date('2026-08-11T08:00:00').getTime(),
    });

    // Query Daily summary for Tenant A context
    const dailyReport = await PointReportService.getDailySummary('2026-08-11');
    expect(dailyReport.totalTransactions).toBe(0);

    // Query Individual report for Tenant B student while context is Tenant A
    const reportB = await PointReportService.getStudentIndividualReport(studentB1);
    expect(reportB).toBeNull();
  });

  it('Gate R11: Offline-First Operation - Operates 100% off Dexie local database', async () => {
    await (pointRepository as any).table.add({
      id: 'P_OFFLINE',
      tenantId: tenantA,
      studentsId: studentA1,
      points: 5,
      type: 'pelanggaran',
      category: 'Disiplin',
      description: 'Offline Test',
      date: '2026-08-11',
    });

    // Directly invoke service without network
    const report = await PointReportService.getDailySummary('2026-08-11');
    expect(report.totalTransactions).toBe(1);
    expect(report.violationsCount).toBe(5);
  });

  it('Gate R12: Empty State Handling - Handles missing students/dates gracefully without throwing', async () => {
    const emptyDaily = await PointReportService.getDailySummary('1990-01-01');
    expect(emptyDaily.totalTransactions).toBe(0);

    const emptyMonthly = await PointReportService.getMonthlySummary('1990-01');
    expect(emptyMonthly.violationsCount).toBe(0);

    const emptyClass = await PointReportService.getClassSummary('NON_EXISTENT_CLASS');
    expect(emptyClass.totalStudents).toBe(0);

    const emptyIndividual = await PointReportService.getStudentIndividualReport('NON_EXISTENT_STUDENT');
    expect(emptyIndividual).toBeNull();
  });
});

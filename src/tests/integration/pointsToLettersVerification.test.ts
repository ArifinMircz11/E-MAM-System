import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EMamDatabase } from '@/core/database/db';
import { pointRepository } from '@/repositories/PointRepository';
import { pointSummaryRepository } from '@/repositories/PointSummaryRepository';
import { letterRepository } from '@/repositories/letterRepository';
import { pointService } from '@/services/pointService';
import { evaluatePointThresholds } from '@/domain/point/pointRuleEngine';
import { initializeLetterEventHandlers } from '@/events/handlers/LetterEventHandler';
import { eventBus } from '@/events/eventBus';
import { SyncStatus } from '@/domain/entities/base';

describe('End-to-End Verification Gate: Points -> Threshold -> Letters Automation', () => {
  let testDb: EMamDatabase;

  const tenantA = 'TENANT-ALPHA';
  const tenantB = 'TENANT-BETA';
  const studentId = 'STUDENT-001';
  const studentName = 'Ahmad Dahlan';

  beforeEach(async () => {
    // 1. Setup isolated Dexie database
    testDb = new EMamDatabase('Test_PointsToLetters_' + Math.random().toString(36).substring(7));
    await testDb.open();

    // 2. Point repositories to testDb tables
    pointRepository.table = testDb.points;
    pointSummaryRepository.table = testDb.student_point_summaries;
    letterRepository.table = testDb.letters;

    // 3. Initialize Event Handlers (Idempotent)
    initializeLetterEventHandlers();
  });

  afterEach(async () => {
    if (testDb && testDb.isOpen()) {
      await testDb.delete();
    }
  });

  it('Gate 1: Ledger & Summary Consistency', async () => {
    const context = { uid: 'teacher-1', tenantId: tenantA, role: 'teacher' };
    
    // Add +10 point transaction
    const result = await pointService.addStudentPoint(
      {
        studentsId: studentId,
        studentName,
        category: 'Pelanggaran Disiplin',
        points: 10,
        type: 'pelanggaran',
        description: 'Terlambat Masuk Sekolah',
        className: 'X-IPA-1',
      },
      context
    );

    expect(result.id).toBeDefined();
    expect(result.newTotalPoints).toBe(10);

    // Verify Ledger (Dexie.points)
    const transactions = await pointRepository.getByStudent(studentId, tenantA);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].points).toBe(10);
    expect(transactions[0].tenantId).toBe(tenantA);

    // Verify Summary (Dexie.student_point_summaries)
    const summary = await pointSummaryRepository.getByStudent(studentId, tenantA);
    expect(summary).not.toBeNull();
    expect(summary?.totalPoints).toBe(10);
  });

  it('Gate 2: Threshold Crossing Detection (20 -> 30 crosses 25 threshold)', () => {
    // 20 -> 30 (crossing threshold 25)
    const events = evaluatePointThresholds({
      studentId,
      studentName,
      className: 'X-IPA-1',
      previousTotal: 20,
      newTotal: 30,
      tenantId: tenantA,
    });

    expect(events).toHaveLength(1);
    expect(events[0].ruleId).toBe('RULE_SP1');
    expect(events[0].thresholdValue).toBe(25);
    expect(events[0].templateType).toBe('Surat Panggilan Orang Tua I (SP-1)');

    // 30 -> 35 (already above threshold 25, no crossing)
    const noEvents = evaluatePointThresholds({
      studentId,
      studentName,
      className: 'X-IPA-1',
      previousTotal: 30,
      newTotal: 35,
      tenantId: tenantA,
    });

    expect(noEvents).toHaveLength(0);
  });

  it('Gate 3: Threshold Reset & Re-crossing Scenario', () => {
    // Student at 30 drops to 15 (e.g. prestasi/deduction) then goes to 27
    const resetEvents = evaluatePointThresholds({
      studentId,
      studentName,
      className: 'X-IPA-1',
      previousTotal: 15,
      newTotal: 27,
      tenantId: tenantA,
    });

    expect(resetEvents).toHaveLength(1);
    expect(resetEvents[0].ruleId).toBe('RULE_SP1');
    expect(resetEvents[0].thresholdValue).toBe(25);
  });

  it('Gate 4 & Gate 5: Event -> Automated Letter Draft & Idempotency', async () => {
    const idempotencyKey = `${tenantA}|${studentId}|RULE_SP1|v1`;

    // Publish POINT_THRESHOLD_EXCEEDED event #1
    await eventBus.publish('POINT_THRESHOLD_EXCEEDED', {
      id: 'EVT-001',
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        studentId,
        studentName,
        className: 'X-IPA-1',
        previousTotal: 20,
        newTotal: 30,
        thresholdValue: 25,
        ruleId: 'RULE_SP1',
        templateType: 'Surat Panggilan Orang Tua I (SP-1)',
        sanctionLabel: 'Peringatan I',
        tenantId: tenantA,
        idempotencyKey,
      },
    });

    // Wait for async handler
    await new Promise(r => setTimeout(r, 100));

    // Verify Draft Letter in Dexie
    const lettersTenantA = await letterRepository.findAll(tenantA);
    expect(lettersTenantA).toHaveLength(1);
    expect(lettersTenantA[0].type).toBe('Surat Panggilan Orang Tua I (SP-1)');
    expect(lettersTenantA[0].status).toBe('Pending');
    expect(lettersTenantA[0].syncStatus).toBe(SyncStatus.PENDING);

    // Publish EVENT #2 with SAME idempotencyKey
    await eventBus.publish('POINT_THRESHOLD_EXCEEDED', {
      id: 'EVT-002',
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        studentId,
        studentName,
        className: 'X-IPA-1',
        previousTotal: 20,
        newTotal: 30,
        thresholdValue: 25,
        ruleId: 'RULE_SP1',
        templateType: 'Surat Panggilan Orang Tua I (SP-1)',
        sanctionLabel: 'Peringatan I',
        tenantId: tenantA,
        idempotencyKey,
      },
    });

    await new Promise(r => setTimeout(r, 100));

    // Verify MUST STILL BE 1 draft letter
    const lettersAfterDuplicate = await letterRepository.findAll(tenantA);
    expect(lettersAfterDuplicate).toHaveLength(1);
  });

  it('Gate 6: Multi-Tenant Data Isolation', async () => {
    const contextA = { uid: 'teacher-1', tenantId: tenantA, role: 'teacher' };
    
    // Add point for Student in Tenant A
    await pointService.addStudentPoint(
      {
        studentsId: studentId,
        studentName,
        category: 'Pelanggaran Disiplin',
        points: 10,
        type: 'pelanggaran',
        description: 'Terlambat',
        className: 'X-IPA-1',
      },
      contextA
    );

    // Query from Tenant B context
    const tenantBPoints = await pointRepository.getByStudent(studentId, tenantB);
    expect(tenantBPoints).toHaveLength(0);

    const tenantBSummary = await pointSummaryRepository.getByStudent(studentId, tenantB);
    expect(tenantBSummary).toBeNull();

    const tenantBLetters = await letterRepository.findAll(tenantB);
    expect(tenantBLetters).toHaveLength(0);
  });

  it('Gate 7: Offline-First Operation', async () => {
    // All point and letter operations execute directly against local IndexedDB (Dexie)
    const context = { uid: 'teacher-offline', tenantId: tenantA, role: 'teacher' };
    
    // Add 25 points offline (crossing threshold)
    const result = await pointService.addStudentPoint(
      {
        studentsId: 'STUDENT-OFFLINE',
        studentName: 'Siti Nurhaliza',
        category: 'Pelanggaran Berat',
        points: 25,
        type: 'pelanggaran',
        description: 'Membawa HP saat Ujian',
        className: 'XI-IPS-2',
      },
      context
    );

    expect(result.newTotalPoints).toBe(25);

    // Check letter draft was generated offline
    await new Promise(r => setTimeout(r, 100));
    const letters = await letterRepository.findAll(tenantA);
    const offlineLetter = letters.find(l => (l as any).studentId === 'STUDENT-OFFLINE');
    expect(offlineLetter).toBeDefined();
    expect(offlineLetter?.type).toBe('Surat Panggilan Orang Tua I (SP-1)');
  });
});

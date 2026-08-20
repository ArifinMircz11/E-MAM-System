/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * UNIT & INTEGRATION TEST MOCK SUITE: QR Scanner Simulation & Data Flow
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recordAttendanceByScan, getAttendanceByClassAndDate, getAttendanceByClassAndMonth } from '@/features/attendance/services/attendanceService';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { attendanceRepository } from '@/repositories/attendanceRepository';
import { syncRepository } from '@/repositories/SyncRepository';
import { TenantContext } from '@/core/context/TenantContext';
import { setupCanonicalSecurityContext, teardownCanonicalSecurityContext } from '../tests/fixtures/securityContext';

// Mock dependencies
vi.mock('@/features/students/repositories/StudentRepository', () => ({
  studentRepository: {
    findByQrCode: vi.fn(),
  },
}));

vi.mock('@/repositories/attendanceRepository', () => ({
  attendanceRepository: {
    getById: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    getByClassAndDate: vi.fn(),
    getByClassAndMonth: vi.fn(),
    getByDate: vi.fn(),
    getByStudentId: vi.fn(),
  },
}));

vi.mock('@/repositories/SyncRepository', () => ({
  syncRepository: {
    enqueue: vi.fn(),
  },
}));

vi.mock('@/repositories/PointRepository', () => ({
  pointRepository: {
    create: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock('@/repositories/PointSummaryRepository', () => ({
  pointSummaryRepository: {
    getByStudent: vi.fn().mockResolvedValue({ totalPoints: 100 }),
    create: vi.fn(),
    update: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock('@/services/securityService', () => ({
  assertPermission: vi.fn(),
  checkPermission: vi.fn(() => true),
}));

vi.mock('@/services/PermissionChecker', () => ({
  PermissionChecker: {
    can: vi.fn(() => true),
    assert: vi.fn(),
  },
}));

vi.mock('@/services/AuthorizationService', () => ({
  AuthorizationService: {
    can: vi.fn(() => true),
    assert: vi.fn(),
  },
}));

vi.mock('@/utils/timezone', () => ({
  getMakassarDateString: () => '2026-07-08',
  getMakassarTimeString: vi.fn(() => '07:00'), // default on time
}));

describe('QR Scanner Simulation & Data Flow Test Suite (IMAM System)', () => {
  const mockTenantId = 'tenant_test_123';
  const mockStudent = {
    id: 'std_001',
    idUnik: 'QR-STUDENT-001',
    namaLengkap: 'Fatimah Az-Zahra',
    nisn: '1234567890',
    tingkatRombel: 'VII-A',
    tenantId: mockTenantId,
    sistemJangkar: { tenantId: mockTenantId },
    kontakDanWali: { nomorHpSiswa: '08123456789' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupCanonicalSecurityContext('user-1', mockTenantId);
  });

  afterEach(() => {
    teardownCanonicalSecurityContext();
  });

  it('1. Mensimulasikan Scan QR Masuk Tepat Waktu (On-Time Attendance)', async () => {
    const { getMakassarTimeString } = await import('@/utils/timezone');
    (getMakassarTimeString as any).mockReturnValue('07:15'); // Tepat waktu (< 07:30)

    (studentRepository.findByQrCode as any).mockResolvedValue(mockStudent);
    (attendanceRepository.findById as any).mockResolvedValue(null);
    (attendanceRepository.getById as any).mockResolvedValue(null);
    (attendanceRepository.save as any).mockResolvedValue(true);
    (attendanceRepository.update as any).mockResolvedValue(true);
    (syncRepository.enqueue as any).mockResolvedValue('queue_id_1');

    const result = await recordAttendanceByScan('QR-STUDENT-001', 'Masuk', false);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Hadir');
    expect(studentRepository.findByQrCode).toHaveBeenCalledWith(
      mockTenantId,
      'QR-STUDENT-001'
    );
    expect(attendanceRepository.update).toHaveBeenCalled();
    expect(syncRepository.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: mockTenantId,
        action: 'SCAN_PRESENSI',
        collection: 'attendance',
        payload: expect.objectContaining({
          studentId: 'QR-STUDENT-001',
          status: 'Hadir',
          session: 'Masuk',
        }),
      })
    );
  });

  it('2. Mensimulasikan Scan QR Masuk Terlambat (Late Attendance & Points Penalty)', async () => {
    const { getMakassarTimeString } = await import('@/utils/timezone');
    (getMakassarTimeString as any).mockReturnValue('07:45'); // Terlambat (> 07:30)

    (studentRepository.findByQrCode as any).mockResolvedValue(mockStudent);
    (attendanceRepository.findById as any).mockResolvedValue(null);
    (attendanceRepository.getById as any).mockResolvedValue(null);
    (attendanceRepository.save as any).mockResolvedValue(true);
    (attendanceRepository.update as any).mockResolvedValue(true);
    (syncRepository.enqueue as any).mockResolvedValue('queue_id_2');

    const result = await recordAttendanceByScan('QR-STUDENT-001', 'Masuk', false);

    expect(result.success).toBe(true);
    expect(result.message).toBe('T'); // Terlambat status
    expect(syncRepository.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          status: 'T',
          pointsPenalty: 5,
          penaltyType: 'Terlambat',
        }),
      })
    );
  });

  it('3. Mensimulasikan Scan QR Sesi Shalat dengan Mode Haid (Haid Mode)', async () => {
    const { getMakassarTimeString } = await import('@/utils/timezone');
    (getMakassarTimeString as any).mockReturnValue('12:15');

    (studentRepository.findByQrCode as any).mockResolvedValue(mockStudent);
    (attendanceRepository.findById as any).mockResolvedValue(null);
    (attendanceRepository.getById as any).mockResolvedValue(null);
    (attendanceRepository.save as any).mockResolvedValue(true);
    (attendanceRepository.update as any).mockResolvedValue(true);
    (syncRepository.enqueue as any).mockResolvedValue('queue_id_3');

    const result = await recordAttendanceByScan('QR-STUDENT-001', 'Zuhur', true);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Haid');
    expect(syncRepository.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          status: 'Haid',
          isHaidMode: true,
          pointsPenalty: 0,
        }),
      })
    );
  });

  it('4. Menguji Pengambilan Rekapitulasi Harian dan Bulanan dari Cache Lokal Dexie', async () => {
    const mockRecords = [
      { id: 'QR-STUDENT-001_2026-07-08', studentsId: 'QR-STUDENT-001', namaLengkap: 'Fatimah Az-Zahra', tanggal: '2026-07-08', masuk: '07:15' }
    ];

    (attendanceRepository.getByClassAndDate as any).mockResolvedValue(mockRecords);
    (attendanceRepository.getByClassAndMonth as any).mockResolvedValue(mockRecords);

    const dailyResult = await getAttendanceByClassAndDate('VII-A', '2026-07-08');
    expect(dailyResult.length).toBe(1);
    expect(dailyResult[0].studentsId).toBe('QR-STUDENT-001');

    const monthlyResult = await getAttendanceByClassAndMonth('VII-A', '2026-07');
    expect(monthlyResult.length).toBe(1);
    expect(monthlyResult[0].tanggal).toBe('2026-07-08');
  });

  it('5. Menolak Scan QR jika ID Tidak Valid atau Tidak Terdaftar di Dexie', async () => {
    (studentRepository.findByQrCode as any).mockResolvedValue(null);

    const result = await recordAttendanceByScan('INVALID-QR', 'Masuk', false);

    expect(result.success).toBe(false);
    expect(result.message).toBe('ID_TIDAK_VALID');
    expect(attendanceRepository.save).not.toHaveBeenCalled();
    expect(syncRepository.enqueue).not.toHaveBeenCalled();
  });
});

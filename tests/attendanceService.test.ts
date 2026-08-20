import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recordAttendanceByScan } from '@/features/attendance/services/attendanceService';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { attendanceRepository } from '@/repositories/attendanceRepository';
import { syncRepository } from '@/repositories/SyncRepository';
import { setupCanonicalSecurityContext, teardownCanonicalSecurityContext } from '../tests/fixtures/securityContext';

// Mock dependencies
vi.mock('@/features/students/repositories/StudentRepository', () => ({
  studentRepository: {
    findByQrCode: vi.fn(),
  },
}));

vi.mock('@/repositories/attendanceRepository', () => ({
  attendanceRepository: {
    findById: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock('@/repositories/SyncRepository', () => ({
  syncRepository: {
    enqueue: vi.fn(),
  },
}));

vi.mock('@/utils/timezone', () => ({
  getMakassarDateString: vi.fn(() => '2026-05-17'),
  getMakassarTimeString: vi.fn(() => '07:00'),
  normalizeRombelName: vi.fn((name) => name || 'X-1'),
}));

vi.mock('@/services/PermissionChecker', () => ({
  PermissionChecker: {
    hasPermission: vi.fn().mockReturnValue(true),
    assert: vi.fn(),
  },
}));

vi.mock('@/services/AuthorizationService', () => ({
  AuthorizationService: {
    hasPermission: vi.fn().mockReturnValue(true),
    assert: vi.fn(),
  },
}));

vi.mock('@/services/securityService', () => ({
  assertPermission: vi.fn(),
  isReadOnly: vi.fn().mockReturnValue(false),
}));

vi.mock('@/services/auditLogService', () => ({
  auditLog: vi.fn(),
  logAudit: vi.fn(),
}));

vi.mock('@/services/pointService', () => ({
  getPointCategories: vi.fn(() => Promise.resolve([])),
  addStudentPoint: vi.fn(() => Promise.resolve()),
}));

describe('recordAttendanceByScan', () => {
  const mockStudent = {
    id: 'S1',
    idUnik: 'UNIQ1',
    namaLengkap: 'Siswa Satu',
    tingkatRombel: '10 A',
    tenantId: 'tenant-test-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupCanonicalSecurityContext();
  });

  afterEach(() => {
    teardownCanonicalSecurityContext();
  });

  it('should return ID_TIDAK_VALID if student is not found', async () => {
    (studentRepository.findByQrCode as any).mockResolvedValue(null);

    const result = await recordAttendanceByScan('invalid-id', 'Masuk');
    expect(result.success).toBe(false);
    expect(result.message).toBe('ID_TIDAK_VALID');
  });

  it('should successfully record attendance locally and enqueue sync', async () => {
    (studentRepository.findByQrCode as any).mockResolvedValue(mockStudent);
    (attendanceRepository.findById as any).mockResolvedValue(null);
    (attendanceRepository.update as any).mockResolvedValue(true);
    (syncRepository.enqueue as any).mockResolvedValue('queue_1');

    const result = await recordAttendanceByScan('UNIQ1', 'Masuk');
    expect(result.success).toBe(true);
    expect(attendanceRepository.update).toHaveBeenCalled();
  });

  it('should record LATE (T) if tap Masuk after 07:30', async () => {
    const { getMakassarTimeString } = await import('@/utils/timezone');
    (getMakassarTimeString as any).mockReturnValue('07:45');

    (studentRepository.findByQrCode as any).mockResolvedValue(mockStudent);
    (attendanceRepository.findById as any).mockResolvedValue(null);
    (attendanceRepository.update as any).mockResolvedValue(true);
    (syncRepository.enqueue as any).mockResolvedValue('queue_2');

    const result = await recordAttendanceByScan('UNIQ1', 'Masuk');
    expect(result.success).toBe(true);
    expect(result.message).toBe('T');
  });

  it('should apply Haid mode logic for prayer sessions', async () => {
    const { getMakassarTimeString } = await import('@/utils/timezone');
    (getMakassarTimeString as any).mockReturnValue('12:15');

    (studentRepository.findByQrCode as any).mockResolvedValue(mockStudent);
    (attendanceRepository.findById as any).mockResolvedValue(null);
    (attendanceRepository.update as any).mockResolvedValue(true);
    (syncRepository.enqueue as any).mockResolvedValue('queue_3');

    const result = await recordAttendanceByScan('UNIQ1', 'Zuhur', true);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Haid');
  });
});

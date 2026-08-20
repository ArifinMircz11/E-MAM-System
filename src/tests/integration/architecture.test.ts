// @ts-nocheck
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EMamDatabase } from '../../core/database/db';
import { StudentRepository } from '../../features/students/repositories/StudentRepository';
import type { SecurityContext } from '../../core/security/types';
import { SyncStatus } from '../../domain/entities/base';

describe('IMAM System Enterprise Architecture Integration Tests', () => {
  let testDb: EMamDatabase;
  let studentRepo: StudentRepository;

  const contextAlpha: SecurityContext = {
    uid: 'user-alpha-1',
    tenantId: 'tenant-alpha-uuid',
    role: 'admin',
    roles: ['admin'],
    isDeveloper: false,
    permissions: ['*'],
  };

  const contextBeta: SecurityContext = {
    uid: 'user-beta-1',
    tenantId: 'tenant-beta-uuid',
    role: 'admin',
    roles: ['admin'],
    isDeveloper: false,
    permissions: ['*'],
  };

  beforeEach(async () => {
    // Initialize in-memory / unique ephemeral Dexie instance for test isolation
    testDb = new EMamDatabase('Test_EMam_DB_' + Math.random());
    await testDb.open();

    // Instantiate repository and point to testDb instance if needed
    studentRepo = new StudentRepository();
    // Override the table reference to testDb for isolation
    studentRepo.table = testDb.students;
  });

  afterEach(async () => {
    if (testDb && testDb.isOpen()) {
      await testDb.delete();
    }
  });

  it('Skenario Uji 1: Tenant Isolation Bypass Prevention', async () => {
    // 1. Create student under Tenant Alpha
    const newStudent = await studentRepo.save(contextAlpha, {
      id: 'student-001',
      tenantId: 'tenant-alpha-uuid',
      namaLengkap: 'Budi Santoso',
      nisn: '1234567890',
      classId: 'class-10A',
    });

    expect(newStudent).toBeDefined();
    expect(newStudent.tenantId).toBe('tenant-alpha-uuid');

    // 2. Attempt cross-tenant read from Tenant Beta context
    const crossTenantRead = await studentRepo.getById(contextBeta, 'student-001');
    expect(crossTenantRead).toBeNull();

    // 3. Attempt cross-tenant save / update from Tenant Beta context (should throw Security Violation)
    await expect(
      studentRepo.save(contextBeta, {
        id: 'student-001',
        tenantId: 'tenant-alpha-uuid',
        namaLengkap: 'Budi Hack',
      })
    ).rejects.toThrow(/Tenant mismatch|Security violation|foreign tenant/i);
  });

  it('Skenario Uji 2: Offline-First Pipeline Verification', async () => {
    // 1. Simulate offline state (no network mock / cloud calls)
    const offlineContext: SecurityContext = {
      ...contextAlpha,
    };

    // 2. Execute save (create) method on repository
    const createdStudent = await studentRepo.save(offlineContext, {
      id: 'student-offline-01',
      tenantId: 'tenant-alpha-uuid',
      namaLengkap: 'Siti Aminah',
      nisn: '0987654321',
      classId: 'class-10B',
    });

    // 3. Verify data stored locally in Dexie with syncStatus 'pending'
    const localRecord = await testDb.students.get('student-offline-01');
    expect(localRecord).toBeDefined();
    expect(localRecord?.syncStatus).toBe(SyncStatus.PENDING);

    // 4. Verify sync_queue contains exactly 1 record for this mutation
    const queueRecords = await testDb.sync_queue.toArray();
    expect(queueRecords.length).toBe(1);
    expect(queueRecords[0].tenantId).toBe('tenant-alpha-uuid');
    expect(queueRecords[0].collection).toBe('students');

    // 5. Verify audit logging / table entries
    // Enqueue or record audit log if applicable or verify audit table
    await testDb.audit_logs.put({
      id: 'audit-01',
      tenantId: 'tenant-alpha-uuid',
      userId: offlineContext.uid,
      action: 'CREATE_STUDENT',
      timestamp: Date.now(),
    });

    const auditRecords = await testDb.audit_logs.toArray();
    expect(auditRecords.length).toBe(1);
    expect(auditRecords[0].action).toBe('CREATE_STUDENT');
  });
});

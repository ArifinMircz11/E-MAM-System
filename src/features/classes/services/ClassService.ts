import { SecurityContext } from '@/core/security/SecurityContext';
import { AuthorizationService } from '@/core/authorization/services/AuthorizationService';
import { CLASS_PERMISSIONS } from '../permissions';
import { dexieClassRepository } from '@/repositories/implementations/DexieClassRepository';
import type { IClassEntity } from '@/repositories/contracts/IClassRepository';
import type { ClassFormData } from '../schemas/class.schema';
import { validateClass } from '../validators/class.validator';
import { syncRepository } from '@/repositories/SyncRepository';
import { auditRepository } from '@/repositories/auditRepository';
import { SyncStatus } from '@/domain/entities/base';
import { localDb } from '@/database/dexie'; // ADDED THIS

export class ClassService {
  async getList(context: any): Promise<IClassEntity[]> {
    const effectiveContext = context || { role: 'guru', accountType: 'madrasah', tenantId: '30315537' };
    console.log('[RCA Audit] ClassService.getList called, default guru', effectiveContext);
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.view, undefined, effectiveContext as any);
    return await dexieClassRepository.findByTenant(effectiveContext as any, effectiveContext.tenantId || '30315537');
  }

  async getById(context: any, id: string): Promise<IClassEntity | null> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.view, undefined, context);
    const item = await dexieClassRepository.getById(context, id);
    if (item && !context.isDeveloper && item.tenantId !== context.tenantId) {
      throw new Error('Security violation: cross-tenant access denied');
    }
    return item;
  }

  async create(context: any, data: ClassFormData): Promise<IClassEntity> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.create, undefined, context);
    const errors = validateClass(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const existing = await dexieClassRepository.findByKodeKelas(context, context.tenantId, data.kodeKelas);
    if (existing) {
      throw new Error(`Kode kelas ${data.kodeKelas} sudah terdaftar.`);
    }

    const id = `class_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const payload: IClassEntity = {
      id,
      tenantId: context.tenantId,
      namaKelas: data.namaKelas,
      kodeKelas: data.kodeKelas,
      tingkat: data.tingkat,
      jurusan: data.jurusan || '',
      tahunAjaran: data.tahunAjaran,
      semester: data.semester,
      waliKelasId: data.waliKelasId || '',
      jumlahSiswa: data.jumlahSiswa || 0,
      status: data.status || 'aktif',
      createdAt: now,
      updatedAt: now,
      createdBy: context.uid,
      updatedBy: context.uid,
      version: 1,
      schemaVersion: 1 as number,
      syncStatus: SyncStatus.PENDING,
      deleted: false,
    };

    const saved = await dexieClassRepository.save(context, payload);

    try {
      await syncRepository.enqueue({
        tenantId: context.tenantId,
        collection: 'classes',
        action: 'CREATE',
        payload: saved,
      });
    } catch (e) {
      console.error('Failed to register sync queue:', e);
    }

    try {
      await auditRepository.save(context as any, {
        id: `audit_${now}`,
        tenantId: context.tenantId,
        userId: context.uid,
        action: 'CLASS_CREATED',
        details: `Created class ${data.namaKelas} (${data.kodeKelas})`,
        timestamp: now,
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }

    return saved;
  }

  async update(context: any, id: string, data: ClassFormData): Promise<IClassEntity> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.update, undefined, context);
    const errors = validateClass(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const existing = await this.getById(context, id);
    if (!existing) {
      throw new Error(`Class with id ${id} not found`);
    }

    const now = Date.now();
    const payload: IClassEntity = {
      ...existing,
      namaKelas: data.namaKelas,
      kodeKelas: data.kodeKelas,
      tingkat: data.tingkat,
      jurusan: data.jurusan !== undefined ? data.jurusan : existing.jurusan,
      tahunAjaran: data.tahunAjaran,
      semester: data.semester,
      waliKelasId: data.waliKelasId !== undefined ? data.waliKelasId : existing.waliKelasId,
      status: data.status !== undefined ? data.status : existing.status,
      updatedAt: now,
      updatedBy: context.uid,
      syncStatus: 'pending' as any,
    };

    const saved = await dexieClassRepository.save(context, payload);

    try {
      await syncRepository.enqueue({
        tenantId: context.tenantId,
        collection: 'classes',
        action: 'UPDATE',
        payload: saved,
      });
    } catch (e) {
      console.error('Failed to register sync queue:', e);
    }

    try {
      await auditRepository.save(context as any, {
        id: `audit_${now}`,
        tenantId: context.tenantId,
        userId: context.uid,
        action: 'CLASS_UPDATED',
        details: `Updated class ${data.namaKelas} (${data.kodeKelas})`,
        timestamp: now,
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }

    return saved;
  }

  async delete(context: any, id: string): Promise<void> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.delete, undefined, context);
    const existing = await this.getById(context, id);
    if (!existing) {
      throw new Error(`Kelas dengan ID ${id} tidak ditemukan`);
    }

    // e-MAM Enterprise Validation Rule: Soft Delete Validation
    // DeleteClassService -> cek siswa aktif -> cek jadwal -> cek nilai -> jika kosong -> hapus
    
    // 1. Cek Siswa Aktif
    try {
      const studentsTable = localDb.table('students');
      const activeStudents = await studentsTable
        .where('classId')
        .equals(id)
        .filter((s: any) => !s.deleted && s.status === 'Aktif')
        .toArray();
      if (activeStudents.length > 0) {
        throw new Error(`Kelas tidak dapat dinonaktifkan/dihapus karena masih memiliki ${activeStudents.length} siswa aktif.`);
      }
    } catch (e: any) {
      if (e.message?.includes('tidak dapat dinonaktifkan')) throw e;
      console.warn('[ClassService] Error checking active students during delete, bypassing safely:', e);
    }

    // 2. Cek Jadwal Pelajaran (Schedules)
    try {
      const schedulesTable = localDb.table('schedules');
      const relatedSchedules = await schedulesTable
        .where('classId')
        .equals(id)
        .toArray();
      if (relatedSchedules.length > 0) {
        throw new Error(`Kelas tidak dapat dinonaktifkan/dihapus karena masih terikat dengan ${relatedSchedules.length} jadwal pelajaran.`);
      }
    } catch (e: any) {
      if (e.message?.includes('tidak dapat dinonaktifkan')) throw e;
      console.warn('[ClassService] Error checking schedules during delete, bypassing safely:', e);
    }

    // 3. Cek Nilai (Penilaian)
    try {
      const gradesTable = localDb.table('penilaian');
      const relatedGrades = await gradesTable
        .filter((item: any) => item.classId === id || item.kelasId === id)
        .toArray();
      if (relatedGrades.length > 0) {
        throw new Error(`Kelas tidak dapat dinonaktifkan/dihapus karena sudah memiliki ${relatedGrades.length} data penilaian akademik.`);
      }
    } catch (e: any) {
      if (e.message?.includes('tidak dapat dinonaktifkan')) throw e;
      console.warn('[ClassService] Error checking grades during delete, bypassing safely:', e);
    }

    const now = Date.now();
    const payload: IClassEntity = {
      ...existing,
      status: 'nonaktif',
      deleted: true,
      updatedAt: now,
      updatedBy: context.uid,
      syncStatus: 'pending' as any,
    };

    await dexieClassRepository.save(context, payload);

    try {
      await syncRepository.enqueue({
        tenantId: context.tenantId,
        collection: 'classes',
        action: 'DELETE',
        payload: { id },
      });
    } catch (e) {
      console.error('Failed to register sync queue:', e);
    }

    try {
      await auditRepository.save(context as any, {
        id: `audit_${now}`,
        tenantId: context.tenantId,
        userId: context.uid,
        action: 'CLASS_DEACTIVATED',
        details: `Deactivated class ${existing.namaKelas}`,
        timestamp: now,
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }
  }

  async assignTeacher(context: any, classId: string, teacherId: string): Promise<IClassEntity> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.assignTeacher, undefined, context);
    const existing = await this.getById(context, classId);
    if (!existing) {
      throw new Error(`Kelas dengan ID ${classId} tidak ditemukan`);
    }

    const now = Date.now();
    const payload: IClassEntity = {
      ...existing,
      waliKelasId: teacherId,
      updatedAt: now,
      updatedBy: context.uid,
      syncStatus: 'pending' as any,
    };

    const saved = await dexieClassRepository.save(context, payload);

    try {
      await syncRepository.enqueue({
        tenantId: context.tenantId,
        collection: 'classes',
        action: 'UPDATE',
        payload: saved,
      });
    } catch (e) {
      console.error('Failed to register sync queue:', e);
    }

    try {
      await auditRepository.save(context as any, {
        id: `audit_${now}`,
        tenantId: context.tenantId,
        userId: context.uid,
        action: 'CLASS_ASSIGN_TEACHER',
        details: `Assigned teacher ${teacherId} as Wali Kelas for class ${existing.namaKelas}`,
        timestamp: now,
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }

    return saved;
  }

  async assignStudent(context: any, classId: string, studentId: string): Promise<void> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.assignStudent, undefined, context);
    const existingClass = await this.getById(context, classId);
    if (!existingClass) {
      throw new Error(`Kelas dengan ID ${classId} tidak ditemukan`);
    }

    const studentTable = localDb.table('students');
    const student = await studentTable.where('id').equals(studentId).first();
    if (!student) {
      throw new Error(`Siswa dengan ID ${studentId} tidak ditemukan`);
    }

    const now = Date.now();
    const updatedStudent = {
      ...student,
      classId: classId,
      className: existingClass.namaKelas,
      tingkatRombel: existingClass.namaKelas,
      rombel: existingClass.namaKelas,
      tingkat: existingClass.tingkat,
      updatedAt: now,
      syncStatus: 'pending' as any,
    };

    await studentTable.put(updatedStudent);

    // Enqueue student sync
    try {
      await localDb.table('sync_queue').add({
        id: `SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        tenantId: context.tenantId,
        collection: 'students',
        operation: 'UPDATE',
        action: 'UPDATE',
        payload: updatedStudent,
        status: 'pending',
        createdAt: Date.now(),
        priority: 'high',
      } as any);
    } catch (e) {
      console.error('Failed to register student sync queue:', e);
    }

    // Update class student count
    const allStudentsInClass = await studentTable.where('classId').equals(classId).toArray();
    existingClass.jumlahSiswa = allStudentsInClass.length;
    existingClass.updatedAt = now;
    await dexieClassRepository.save(context, existingClass);

    try {
      await syncRepository.enqueue({
        tenantId: context.tenantId,
        collection: 'classes',
        action: 'UPDATE',
        payload: existingClass,
      });
    } catch (e) {
      console.error('Failed to register class count sync queue:', e);
    }

    try {
      await auditRepository.save(context as any, {
        id: `audit_${now}`,
        tenantId: context.tenantId,
        userId: context.uid,
        action: 'CLASS_ASSIGN_STUDENT',
        details: `Assigned student ${student.namaLengkap || studentId} to class ${existingClass.namaKelas}`,
        timestamp: now,
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }
  }

  async removeStudent(context: any, classId: string, studentId: string): Promise<void> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.removeStudent, undefined, context);
    const existingClass = await this.getById(context, classId);
    if (!existingClass) {
      throw new Error(`Kelas dengan ID ${classId} tidak ditemukan`);
    }

    const studentTable = localDb.table('students');
    const student = await studentTable.where('id').equals(studentId).first();
    if (!student) {
      throw new Error(`Siswa dengan ID ${studentId} tidak ditemukan`);
    }

    const now = Date.now();
    const updatedStudent = {
      ...student,
      classId: '',
      className: 'BELUM_DISET',
      tingkatRombel: 'BELUM_DISET',
      rombel: 'BELUM_DISET',
      tingkat: '',
      updatedAt: now,
      syncStatus: 'pending' as any,
    };

    await studentTable.put(updatedStudent);

    // Enqueue student sync
    try {
      await localDb.table('sync_queue').add({
        id: `SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        tenantId: context.tenantId,
        collection: 'students',
        operation: 'UPDATE',
        action: 'UPDATE',
        payload: updatedStudent,
        status: 'pending',
        createdAt: Date.now(),
        priority: 'high',
      } as any);
    } catch (e) {
      console.error('Failed to register student sync queue:', e);
    }

    // Update class student count
    const allStudentsInClass = await studentTable.where('classId').equals(classId).toArray();
    existingClass.jumlahSiswa = allStudentsInClass.length;
    existingClass.updatedAt = now;
    await dexieClassRepository.save(context, existingClass);

    try {
      await syncRepository.enqueue({
        tenantId: context.tenantId,
        collection: 'classes',
        action: 'UPDATE',
        payload: existingClass,
      });
    } catch (e) {
      console.error('Failed to register class count sync queue:', e);
    }

    try {
      await auditRepository.save(context as any, {
        id: `audit_${now}`,
        tenantId: context.tenantId,
        userId: context.uid,
        action: 'CLASS_REMOVE_STUDENT',
        details: `Removed student ${student.namaLengkap || studentId} from class ${existingClass.namaKelas}`,
        timestamp: now,
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }
  }

  async transferStudent(context: any, studentId: string, targetClassId: string): Promise<void> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.transferStudent, undefined, context);
    const targetClass = await this.getById(context, targetClassId);
    if (!targetClass) {
      throw new Error(`Kelas tujuan dengan ID ${targetClassId} tidak ditemukan`);
    }

    const studentTable = localDb.table('students');
    const student = await studentTable.where('id').equals(studentId).first();
    if (!student) {
      throw new Error(`Siswa dengan ID ${studentId} tidak ditemukan`);
    }

    const oldClassId = student.classId;
    const now = Date.now();
    
    const updatedStudent = {
      ...student,
      classId: targetClassId,
      className: targetClass.namaKelas,
      tingkatRombel: targetClass.namaKelas,
      rombel: targetClass.namaKelas,
      tingkat: targetClass.tingkat,
      updatedAt: now,
      syncStatus: 'pending' as any,
    };

    await studentTable.put(updatedStudent);

    // Enqueue student sync
    try {
      await localDb.table('sync_queue').add({
        id: `SYNC_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        tenantId: context.tenantId,
        collection: 'students',
        operation: 'UPDATE',
        action: 'UPDATE',
        payload: updatedStudent,
        status: 'pending',
        createdAt: Date.now(),
        priority: 'high',
      } as any);
    } catch (e) {
      console.error('Failed to register student sync queue:', e);
    }

    // Update target class student count
    const allStudentsInTarget = await studentTable.where('classId').equals(targetClassId).toArray();
    targetClass.jumlahSiswa = allStudentsInTarget.length;
    targetClass.updatedAt = now;
    await dexieClassRepository.save(context as any, targetClass);

    try {
      await syncRepository.enqueue({
        tenantId: context.tenantId,
        collection: 'classes',
        action: 'UPDATE',
        payload: targetClass,
      });
    } catch (e) {
      console.error('Failed to register class count sync queue:', e);
    }

    // Update old class student count if any
    if (oldClassId) {
      const oldClass = await this.getById(context, oldClassId);
      if (oldClass) {
        const allStudentsInOld = await studentTable.where('classId').equals(oldClassId).toArray();
        oldClass.jumlahSiswa = allStudentsInOld.length;
        oldClass.updatedAt = now;
        await dexieClassRepository.save(context as any, oldClass);

        try {
          await syncRepository.enqueue({
            tenantId: context.tenantId,
            collection: 'classes',
            action: 'UPDATE',
            payload: oldClass,
          });
        } catch (e) {
          console.error('Failed to register old class count sync queue:', e);
        }
      }
    }

    try {
      await auditRepository.save(context as any, {
        id: `audit_${now}`,
        tenantId: context.tenantId,
        userId: context.uid,
        action: 'CLASS_TRANSFER_STUDENT',
        details: `Transferred student ${student.namaLengkap || studentId} to class ${targetClass.namaKelas}`,
        timestamp: now,
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }
  }

  async restore(context: any, classId: string): Promise<IClassEntity> {
    AuthorizationService.assertPermission(CLASS_PERMISSIONS.restore, undefined, context);
    const existing = await dexieClassRepository.getById(context, classId);
    if (!existing) {
      throw new Error(`Kelas dengan ID ${classId} tidak ditemukan`);
    }

    const now = Date.now();
    const payload: IClassEntity = {
      ...existing,
      status: 'aktif',
      deleted: false,
      updatedAt: now,
      updatedBy: context.uid,
      syncStatus: 'pending' as any,
    };

    const saved = await dexieClassRepository.save(context as any, payload);

    try {
      await syncRepository.enqueue({
        tenantId: context.tenantId,
        collection: 'classes',
        action: 'UPDATE',
        payload: saved,
      });
    } catch (e) {
      console.error('Failed to register sync queue:', e);
    }

    try {
      await auditRepository.save(context as any, {
        id: `audit_${now}`,
        tenantId: context.tenantId,
        userId: context.uid,
        action: 'CLASS_RESTORED',
        details: `Restored class ${existing.namaKelas}`,
        timestamp: now,
      });
    } catch (e) {
      console.error('Failed to write audit log:', e);
    }

    return saved;
  }
}

export const classService = new ClassService();

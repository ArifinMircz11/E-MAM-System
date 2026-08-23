import { userRepository } from '@/repositories/userRepository';
import { syncRepository } from '@/repositories/SyncRepository';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { teacherRepository } from '@/repositories/teacherRepository';
import type { UserData, AccountType, Student, Teacher } from '@/types';
import { UserRole } from '@/types';
import { ACCOUNT_LEVEL_MATRIX } from '../utils/roleRegistry';
import { localDb } from '@/database/dexie';
import { CacheService } from '@/services/CacheService';

export class UserService {
  public async getUsers(tenantId: string): Promise<UserData[]> {
    const users = await userRepository.fetchByTenant(tenantId);
    return users as unknown as UserData[];
  }

  public async createUser(operatorUid: string, newUser: UserData): Promise<void> {
    const { uid, tenantId, accountType, roles = [] } = newUser;
    if (!tenantId) throw new Error('Tenant ID wajib dilampirkan.');
    const matrix = ACCOUNT_LEVEL_MATRIX[accountType as AccountType];
    if (!matrix) throw new Error('Jenis Pengguna tidak valid.');
    const primaryRole = roles[0] || newUser.role;
    if (!primaryRole || !matrix.validPrimaryRoles.includes(primaryRole as UserRole)) {
      throw new Error('Peran Utama tidak sesuai dengan Jenis Pengguna yang dipilih.');
    }

    await localDb.transaction('rw', [localDb.users, localDb.sync_queue], async () => {
      const finalUserPayload: UserData = { ...newUser, uid: newUser.uid!, role: primaryRole as UserRole };
      await userRepository.table.put(finalUserPayload as any);
      await syncRepository.enqueue({ tenantId, collection: 'users', action: 'CREATE', payload: finalUserPayload });

      const payload = {
        id: `audit_${Date.now()}_create_${Math.random().toString(36).substring(7)}`,
        tenantId,
        userId: operatorUid,
        action: 'USER_CREATED',
        timestamp: new Date().toISOString(),
        details: `Membuat pengguna baru: ${newUser.email || 'unknown'} (${newUser.displayName || 'unknown'}) sebagai tipe ${accountType} dengan peran utama ${primaryRole}.`,
      };
      await syncRepository.enqueue({ tenantId, action: 'CREATE', collection: 'audit_logs', payload });
    });
  }

  public async syncFromCloud(tenantId: string): Promise<UserData[]> {
    try {
      console.log('[UserService] syncFromCloud dipanggil untuk tenantId:', tenantId);
      const users = await CacheService.refreshCollection<UserData>('users', 'uid', { tenantId });
      console.log('[UserService] CacheService berhasil memuat data pengguna, jumlah:', users.length);
      for (const user of users) await userRepository.table.put(user as any);
      return users;
    } catch (err: any) {
      console.error('[UserService] Gagal menyinkronkan data dari cloud:', err);
      throw new Error('Gagal melakukan sinkronisasi data dari cloud: ' + err.message);
    }
  }

  public async updateUserMetadata(operatorUid: string, updatedUser: UserData): Promise<void> {
    const { uid, tenantId, accountType, roles = [] } = updatedUser;
    if (!tenantId) throw new Error('Tenant ID wajib dilampirkan.');
    const matrix = ACCOUNT_LEVEL_MATRIX[accountType as AccountType];
    if (!matrix) throw new Error('Jenis Pengguna tidak valid.');
    const primaryRole = roles[0] || updatedUser.role;
    if (!primaryRole || !matrix.validPrimaryRoles.includes(primaryRole as UserRole)) {
      throw new Error('Peran Utama tidak sesuai dengan Jenis Pengguna yang dipilih.');
    }

    await localDb.transaction('rw', [localDb.users, localDb.sync_queue], async () => {
      const existingUser = await userRepository.table.get(uid);
      const finalUserPayload: UserData = { ...updatedUser, uid: updatedUser.uid!, role: primaryRole as UserRole };
      await userRepository.table.put(finalUserPayload as any);
      await syncRepository.enqueue({ tenantId, collection: 'users', action: 'UPDATE', payload: finalUserPayload });
      if (existingUser) await this.generateAuditLogs(operatorUid, existingUser as unknown as UserData, finalUserPayload);
    });
  }

  private async generateAuditLogs(operatorUid: string, oldUser: UserData, newUser: UserData): Promise<void> {
    const timestamp = new Date().toISOString();
    const tenantId = newUser.tenantId;

    if (oldUser.accountType !== newUser.accountType) {
      const payload = {
        id: `audit_${Date.now()}_tc_${Math.random().toString(36).substring(7)}`,
        tenantId,
        userId: operatorUid,
        action: 'ACCOUNT_TYPE_CHANGED',
        timestamp,
        details: `Mengubah tipe akun untuk ${newUser.email || 'unknown'} (${newUser.displayName || 'unknown'}) dari ${oldUser.accountType || 'none'} menjadi ${newUser.accountType}.`,
      };
      await syncRepository.enqueue({ tenantId, action: 'CREATE', collection: 'audit_logs', payload });
    }

    if (oldUser.role !== newUser.role) {
      const payload = {
        id: `audit_${Date.now()}_pr_${Math.random().toString(36).substring(7)}`,
        tenantId,
        userId: operatorUid,
        action: 'PRIMARY_ROLE_CHANGED',
        timestamp,
        details: `Mengubah peran utama untuk ${newUser.email || 'unknown'} (${newUser.displayName || 'unknown'}) dari ${oldUser.role || 'none'} menjadi ${newUser.role}.`,
      };
      await syncRepository.enqueue({ tenantId, action: 'CREATE', collection: 'audit_logs', payload });
    }

    const oldRolesJoined = [...(oldUser.roles || [])].sort().join(',');
    const newRolesJoined = [...(newUser.roles || [])].sort().join(',');
    if (oldRolesJoined !== newRolesJoined) {
      const payload = {
        id: `audit_${Date.now()}_ar_${Math.random().toString(36).substring(7)}`,
        tenantId,
        userId: operatorUid,
        action: 'ADDITIONAL_ROLES_CHANGED',
        timestamp,
        details: `Mengubah daftar peran tambahan untuk ${newUser.email || 'unknown'} (${newUser.displayName || 'unknown'}) dari [${oldUser.roles?.join(', ') || ''}] menjadi [${newUser.roles?.join(', ') || ''}].`,
      };
      await syncRepository.enqueue({ tenantId, action: 'CREATE', collection: 'audit_logs', payload });
    }
  }

  public async deleteUser(operatorUid: string, uid: string, tenantId: string): Promise<void> {
    await localDb.transaction('rw', [localDb.users, localDb.sync_queue], async () => {
      const existingUser = await userRepository.table.get(uid);
      await userRepository.table.delete(uid);
      await syncRepository.enqueue({ tenantId, collection: 'users', action: 'DELETE', payload: { uid } });

      if (existingUser) {
        const payload = {
          id: `audit_${Date.now()}_del_${Math.random().toString(36).substring(7)}`,
          tenantId,
          userId: operatorUid,
          action: 'USER_DELETED',
          timestamp: new Date().toISOString(),
          details: `Menghapus pengguna: ${existingUser.profile?.email || 'unknown'} (${existingUser.profile?.displayName || 'unknown'}).`,
        };
        await syncRepository.enqueue({ tenantId, action: 'CREATE', collection: 'audit_logs', payload });
      }
    });
  }

  public async getStudentsCache(tenantId: string): Promise<Student[]> {
    return await studentRepository.findAll(tenantId);
  }

  public async getTeachersCache(tenantId: string): Promise<Teacher[]> {
    return (await teacherRepository.findAll(tenantId)) as unknown as Teacher[];
  }

  public async migrateUser(
    operatorUid: string,
    user: UserData,
    targetType: string,
    selectedRefId: string,
    selectedRoles: UserRole[]
  ): Promise<void> {
    const { tenantId, uid } = user;
    if (!tenantId) throw new Error('Tenant ID wajib dilampirkan.');

    const oldType = user.accountType || 'none';
    const oldRef = user.referenceId || user.assignment?.positionId || 'none';
    let verifiedRefId = selectedRefId || null;
    const isSiswa = targetType === 'SISWA' || selectedRoles.some(r => [UserRole.SISWA, UserRole.KETUA_KELAS].includes(r));

    if (selectedRefId) {
      if (isSiswa) {
        let student = await studentRepository.findById(selectedRefId, tenantId);
        if (!student) student = await studentRepository.fetchByIdUnik(tenantId, selectedRefId);
        if (student) {
          if (student.tenantId && student.tenantId !== tenantId) throw new Error(`Pelanggaran batas tenant: Siswa (${student.tenantId}) berbeda dengan madrasah user (${tenantId}).`);
          verifiedRefId = student.id;
          await studentRepository.update({ ...student, userId: uid, linked: true, isClaimed: true, linkedAt: Date.now() } as any);
        }
      } else {
        let teacher = await teacherRepository.findById(selectedRefId, tenantId);
        if (!teacher) teacher = await teacherRepository.fetchByIdUnik(tenantId, selectedRefId);
        if (teacher) {
          if (teacher.tenantId && teacher.tenantId !== tenantId) throw new Error(`Pelanggaran batas tenant: Guru (${teacher.tenantId}) berbeda dengan madrasah user (${tenantId}).`);
          verifiedRefId = teacher.id;
          await teacherRepository.update({ ...teacher, userId: uid, linked: true, isClaimed: true, linkedAt: Date.now() } as any);
        }
      }
    }

    await localDb.transaction('rw', [localDb.users, localDb.sync_queue, localDb.audit_logs], async () => {
      const migratedUser: any = {
        ...user,
        accountType: targetType as AccountType,
        referenceId: verifiedRefId || undefined,
        studentsId: isSiswa ? verifiedRefId || undefined : undefined,
        teachersId: !isSiswa ? verifiedRefId || undefined : undefined,
        assignment: user.assignment ? { ...user.assignment, positionId: verifiedRefId || undefined } : { positionId: verifiedRefId || undefined },
        roles: selectedRoles,
        role: selectedRoles[0] || UserRole.GURU,
        isClaimed: !!verifiedRefId,
        status: 'active',
        accountStatus: 'active',
        updatedAt: Date.now(),
      };

      await userRepository.table.put(migratedUser as any);
      await syncRepository.enqueue({ tenantId, collection: 'users', action: 'UPDATE', payload: migratedUser });

      const auditPayload = {
        id: `audit_migration_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        userId: operatorUid,
        action: 'USER_MIGRATION',
        timestamp: new Date().toISOString(),
        details: `Migrasi Tipe Akun: Memigrasikan akun ${user.email} (${user.displayName}) dari Tipe ${oldType} (Ref: ${oldRef}) menjadi Tipe ${targetType} (Ref: ${verifiedRefId}). Peran RBAC disesuaikan menjadi: ${selectedRoles.join(', ')}.`,
      };

      await localDb.audit_logs.add(auditPayload);
      await syncRepository.enqueue({ tenantId, action: 'CREATE', collection: 'audit_logs', payload: auditPayload });
    });
  }
}

export const userService = new UserService();

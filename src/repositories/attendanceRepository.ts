import { BaseRepository } from './base/BaseRepository';
import type { AttendanceRecord } from '@/types';
import { localDb } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import { SyncStatus } from '@/domain/entities/base';
import { Dexie } from 'dexie';

/**
 * AttendanceRepository
 * Implementation using Dexie as the primary operational database.
 * Mandatory tenant isolation enforced.
 */
export class AttendanceRepository extends BaseRepository<AttendanceRecord> {
  constructor() {
    super('attendance');
  }

  async findById(id: string, tenantId: string): Promise<AttendanceRecord | null> {
    return (await this.table.where('id').equals(id).filter(a => a.tenantId === tenantId).first()) || null;
  }

  async findAll(tenantId: string): Promise<AttendanceRecord[]> {
    return await this.table.where('tenantId').equals(tenantId).toArray();
  }

  async create(entity: AttendanceRecord): Promise<void> {
    const dbInstance = (this.table as unknown as { db: any }).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      const now = Date.now();
      const dataToSave = {
        ...entity,
        version: 1,
        syncStatus: SyncStatus.PENDING as SyncStatus,
        updatedAt: now,
      };
      
      await this.table.add(dataToSave);
      await syncRepository.enqueue({
        collection: 'attendance',
        action: 'CREATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
        metadata: {
          idempotencyKey: `attendance/${entity.id}:create:v1`,
          version: 1,
        }
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async update(entity: AttendanceRecord): Promise<void> {
    const dbInstance = (this.table as unknown as { db: any }).db || localDb;
    await dbInstance.transaction('rw', [this.table, dbInstance.sync_queue], async () => {
      const existing = await this.table.where({ id: entity.id }).first();
      
      if (!existing) throw new Error("Attendance record not found");
      if (existing.tenantId !== entity.tenantId) throw new Error("Tenant mismatch");
      
      const newVersion = (existing.version || 0) + 1;
      const now = Date.now();
      const dataToSave = {
        ...entity,
        version: newVersion,
        syncStatus: SyncStatus.PENDING as SyncStatus,
        updatedAt: now,
      };
      
      await this.table.put(dataToSave);
      await syncRepository.enqueue({
        collection: 'attendance',
        action: 'UPDATE',
        payload: dataToSave,
        tenantId: entity.tenantId,
        metadata: {
          idempotencyKey: `attendance/${entity.id}:update:v${newVersion}`,
          version: newVersion,
        }
      }, undefined, { triggerSync: false, db: dbInstance });
    });
    (await import('@/services/SyncEngine')).SyncEngine.processQueue().catch(console.error);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    throw new Error("Attendance deletion is not permitted");
  }

  async refresh(tenantId: string): Promise<void> {
    // Sync logic will be handled by SyncService in Phase 3
  }

  // --- BUSINESS-SPECIFIC METHODS ---

  async getByClassAndDate(
    tenantId: string,
    className: string,
    date: string,
  ): Promise<AttendanceRecord[]> {
    const map = new Map<string, AttendanceRecord>();
    const [res1, res2, res3] = await Promise.all([
      this.table.where('[tenantId+classId+date]').equals([tenantId, className, date]).toArray().catch(() => [] as AttendanceRecord[]),
      this.table.where('[tenantId+classId+tanggal]').equals([tenantId, className, date]).toArray().catch(() => [] as AttendanceRecord[]),
      this.table.where('[tenantId+date]').equals([tenantId, date]).toArray().catch(() => [] as AttendanceRecord[]),
    ]);
    res1.concat(res2).concat(res3).forEach((r) => {
      if (r && r.id && (r.classId === className || (r as any).className === className)) {
        map.set(r.id, r);
      }
    });
    if (map.size > 0) return Array.from(map.values());
    const all = await this.getByDate(tenantId, date);
    return all.filter((r) => r.classId === className || (r as any).className === className);
  }

  async getByStudentId(tenantId: string, studentId: string): Promise<AttendanceRecord[]> {
    const map = new Map<string, AttendanceRecord>();

    const queries: Promise<AttendanceRecord[]>[] = [
      this.table.where('[tenantId+studentId+date]').between([tenantId, studentId, Dexie.minKey], [tenantId, studentId, Dexie.maxKey]).toArray().catch(() => [] as AttendanceRecord[]),
      this.table.where('[tenantId+studentsId+date]').between([tenantId, studentId, Dexie.minKey], [tenantId, studentId, Dexie.maxKey]).toArray().catch(() => [] as AttendanceRecord[]),
      this.table.where('[tenantId+studentsId+tanggal]').between([tenantId, studentId, Dexie.minKey], [tenantId, studentId, Dexie.maxKey]).toArray().catch(() => [] as AttendanceRecord[]),
    ];

    const results = await Promise.all(queries);

    results.flat().forEach((r) => {
      if (r && r.id && (!tenantId || r.tenantId === tenantId)) {
        if ((r as any).studentId === studentId || (r as any).studentsId === studentId || r.id.startsWith(`${studentId}_`)) {
          map.set(r.id, r);
        }
      }
    });

    if (map.size > 0) {
      return Array.from(map.values());
    }

    const allTenant = await this.table.where('tenantId').equals(tenantId).toArray();
    return allTenant.filter(
      (r) => (r as any).studentId === studentId || (r as any).studentsId === studentId || (r.id && r.id.startsWith(`${studentId}_`)),
    );
  }

  async getByDate(tenantId: string, date: string): Promise<AttendanceRecord[]> {
    const map = new Map<string, AttendanceRecord>();
    const [res1, res2] = await Promise.all([
      this.table.where('[tenantId+date]').equals([tenantId, date]).toArray().catch(() => [] as AttendanceRecord[]),
      this.table.where('[tenantId+tanggal]').equals([tenantId, date]).toArray().catch(() => [] as AttendanceRecord[]),
    ]);
    res1.concat(res2).forEach((r) => {
      if (r && r.id) map.set(r.id, r);
    });
    if (map.size > 0) return Array.from(map.values());

    const all = await this.findAll(tenantId);
    return all.filter((r) => (r as any).date === date || (r as any).date === date || (r as any).tanggal === date);
  }

  async getByClassAndMonth(
    tenantId: string,
    classId: string,
    month: string,
  ): Promise<AttendanceRecord[]> {
    const start = `${month}-01`;
    const end = `${month}-31`;

    if (classId === 'All' || !classId) {
      return await this.table
        .where('[tenantId+tanggal]')
        .between([tenantId, start], [tenantId, end], true, true)
        .toArray();
    }

    return await this.table
      .where('[tenantId+classId+tanggal]')
      .between([tenantId, classId, start], [tenantId, classId, end], true, true)
      .toArray();
  }

  async getAttendanceSummary(
    tenantId: string,
    date: string,
  ): Promise<any> {
    const records = await this.getByDate(tenantId, date);
    let totalHadir = 0;
    let totalPoinPelanggaran = 0;
    let totalPoinPrestasi = 0;
    const perType = {
      Hadir: 0,
      Terlambat: 0,
      Izin: 0,
      Sakit: 0,
      Alpha: 0,
      Haid: 0,
      TS: 0,
      PC: 0,
    };

    records.forEach((r) => {
      const s = r.status || '';
      if (s === 'Hadir' || s === 'Terlambat' || s === 'PC') {
        totalHadir++;
      }
      if (r.point) {
        totalPoinPelanggaran += r.point.pelanggaran || 0;
        totalPoinPrestasi += r.point.prestasi || 0;
      }
      if (s === 'Hadir') perType.Hadir++;
      else if (s === 'Terlambat') perType.Terlambat++;
      else if (s === 'Izin') perType.Izin++;
      else if (s === 'Sakit') perType.Sakit++;
      else if (s === 'Alpha' || s === 'Alpa') perType.Alpha++;
      else if (s === 'Haid') perType.Haid++;
      else if (s === 'TS') perType.TS++;
      else if (s === 'PC') perType.PC++;
    });

    return {
      totalHadir,
      totalPoinPelanggaran,
      totalPoinPrestasi,
      perType,
      totalGuruHadir: 0,
    };
  }

  async getTodayAttendance(
    tenantId: string,
    date: string,
  ): Promise<AttendanceRecord[]> {
    return await this.getByDate(tenantId, date);
  }

  async getAttendanceByStudent(
    tenantId: string,
    studentId: string,
  ): Promise<AttendanceRecord[]> {
    return await this.getByStudentId(tenantId, studentId);
  }

  async getByTenantAndDate(
    tenantId: string,
    date: string,
  ): Promise<AttendanceRecord[]> {
    return await this.getByDate(tenantId, date);
  }

  async deleteByDate(tenantId: string, date: string): Promise<number> {
    const records = await this.getByDate(tenantId, date);
    const ids = records.map((r) => r.id);
    await this.table.bulkDelete(ids);
    return ids.length;
  }

  async deleteByMonth(tenantId: string, month: string): Promise<number> {
    const records = await this.getByClassAndMonth(tenantId, 'All', month);
    const ids = records.map((r) => r.id);
    await this.table.bulkDelete(ids);
    return ids.length;
  }
}

export const attendanceRepository = new AttendanceRepository();

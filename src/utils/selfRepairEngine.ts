/**
 * @license
 * e-Mam System - Self-Healing & Data Integrity Engine
 * LAYER: UTILITY (Self-Repair Protocol)
 */

import { localDb } from '@/database/dexie';
import { generateClassId, normalizeRombelName } from './rombelHelpers';

interface RepairStudentUpdate {
  className?: string;
  classId?: string;
  tingkatRombel?: string;
  rombel?: string;
  tingkat?: string;
}

interface RepairAttendanceUpdate {
  className?: string;
  classId?: string;
  class?: string;
}

interface RepairClassUpdate {
  name?: string;
  classId?: string;
}

export const selfRepairEngine = {
  /**
   * Heals local database inconsistencies (V12 Migration & Standardization)
   */
  async healLocalData(tenantId: string, onProgress?: (msg: string) => void) {
    if (!tenantId) return;

    try {
      onProgress?.('Memulai protokol Self-Healing v12...');

      // 1. Repair Students Store
      onProgress?.('Memeriksa integritas data siswa...');
      const students = await localDb.students.where('tenantId').equals(tenantId).toArray();
      let studentHealedCount = 0;

      for (const student of students) {
        let needsUpdate = false;
        const update: RepairStudentUpdate = {};

        const rawClass =
          student.className ||
          student.tingkatRombel ||
          student.rombel ||
          (student as Record<string, unknown>).kelas;
        if (typeof rawClass === 'string' && rawClass) {
          const normalized = normalizeRombelName(rawClass);
          const classId = generateClassId(tenantId, normalized);

          if (
            student.className !== normalized ||
            student.classId !== classId ||
            student.tingkatRombel !== normalized ||
            student.rombel !== normalized
          ) {
            update.className = normalized;
            update.classId = classId;
            update.tingkatRombel = normalized;
            update.rombel = normalized;
            update.tingkat = normalized.split(' ')[0] || '';
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await localDb.students.update(student.idUnik, update);
          studentHealedCount++;
        }
      }
      onProgress?.(`Berhasil memulihkan ${studentHealedCount} data siswa.`);

      // 2. Repair Attendance Store
      onProgress?.('Memeriksa integritas data presensi...');
      const attendance = await localDb.attendance.where('tenantId').equals(tenantId).toArray();
      let attHealedCount = 0;

      for (const record of attendance) {
        let needsUpdate = false;
        const update: RepairAttendanceUpdate = {};

        const recordObj = record as Record<string, unknown>;
        const rawClass = record.className || recordObj.class || recordObj.rombel;
        if (typeof rawClass === 'string' && rawClass) {
          const normalized = normalizeRombelName(rawClass);
          const classId = generateClassId(tenantId, normalized);

          if (
            record.className !== normalized ||
            record.classId !== classId ||
            recordObj.class !== normalized
          ) {
            update.className = normalized;
            update.classId = classId;
            update.class = normalized;
            needsUpdate = true;
          }
        }

        if (needsUpdate && record.id) {
          await localDb.attendance.update(record.id, update);
          attHealedCount++;
        }
      }
      onProgress?.(`Berhasil memulihkan ${attHealedCount} data presensi.`);

      // 3. Repair Classes Store
      onProgress?.('Memeriksa integritas data kelas...');
      const classes = await localDb.classes.where('tenantId').equals(tenantId).toArray();
      let classHealedCount = 0;

      for (const cls of classes) {
        let needsUpdate = false;
        const update: RepairClassUpdate = {};

        const normalized = normalizeRombelName(cls.name);
        const classId = generateClassId(tenantId, normalized);

        if (cls.name !== normalized || cls.classId !== classId) {
          update.name = normalized;
          update.classId = classId;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await localDb.classes.update(cls.id || cls.name, update);
          classHealedCount++;
        }
      }
      onProgress?.(`Berhasil memulihkan ${classHealedCount} data kelas.`);

      return {
        students: studentHealedCount,
        attendance: attHealedCount,
        classes: classHealedCount,
      };
    } catch (err) {
      console.error('[SelfRepair] Protocol failed:', err);
      throw err;
    }
  },
};

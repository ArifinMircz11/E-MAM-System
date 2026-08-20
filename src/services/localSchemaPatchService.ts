/**
 * @license
 * e-Mam System - Integrated Madrasah Academic Manager
 * LAYER: SERVICE / LOCAL SCHEMA PATCH SERVICE
 * Handles automatic schema patching of IndexedDB data structures to match current app structures.
 */

import { localDb } from '@/database/dexie';
import { transformStudentToV2, transformTeacherToV2 } from '@/utils/schemaTransforms';

export const CURRENT_LOCAL_SCHEMA_VERSION = 2;

export const localSchemaPatchService = {
  /**
   * Checks the current local schema version and automatically patches records in IndexedDB (Dexie)
   * if they are out of date or missing core nested structures.
   */
  async patchLocalSchemas(
    onProgress?: (msg: string) => void,
  ): Promise<{ success: boolean; patchedStudents: number; patchedTeachers: number }> {
    try {
      console.log('[localSchemaPatchService] Starting local schema version check...');
      if (onProgress) onProgress('Memeriksa versi skema database lokal...');

      // 1. Get current local schema version from Dexie settings
      const versionRecord = await localDb.systemSettings.get('local_schema_version');
      const currentVersion = versionRecord ? Number(versionRecord.value) : 1;

      if (currentVersion >= CURRENT_LOCAL_SCHEMA_VERSION) {
        console.log(
          `[localSchemaPatchService] Local schema version is up to date (v${currentVersion}). No patching needed.`,
        );

        // Extra safety: Check if there are any unpatched individual records anyway
        const needsRecordCheck = await this.checkForOutdatedRecords();
        if (!needsRecordCheck) {
          return { success: true, patchedStudents: 0, patchedTeachers: 0 };
        }
        console.log(
          '[localSchemaPatchService] Individual records found missing V2 fields. Proceeding to individual record patch...',
        );
      }

      console.log(
        `⚡ [localSchemaPatchService] Patching local schema structures (v${currentVersion} -> v${CURRENT_LOCAL_SCHEMA_VERSION})...`,
      );
      if (onProgress) onProgress('Menjalankan migrasi skema data lokal ke V2...');

      let patchedStudentsCount = 0;
      let patchedTeachersCount = 0;

      // 2. Patch Students Table
      const allStudents = await localDb.students.toArray();
      const studentsToUpdate: any[] = [];

      for (const student of allStudents) {
        // If student is missing nested V2 structures or has legacy properties, transform it
        if (!student.sistemJangkar || !student.kontakDanWali || !student.logPoinKedisiplinan) {
          const docId = student.studentsId || student.idUnik || student.id || '';
          const patchedStudent = transformStudentToV2(student, docId);
          studentsToUpdate.push(patchedStudent);
          patchedStudentsCount++;
        }
      }

      if (studentsToUpdate.length > 0) {
        console.log(
          `[localSchemaPatchService] Patching ${studentsToUpdate.length} legacy students records to V2...`,
        );
        await localDb.students.bulkPut(studentsToUpdate);
      }

      // 3. Patch Teachers Table
      const allTeachers = await localDb.teachers.toArray();
      const teachersToUpdate: any[] = [];

      for (const teacher of allTeachers) {
        // If teacher is missing V2 structures, transform it
        if (!teacher.sistemJangkar || !teacher.jabatanDanStatus || !teacher.penugasanAkademik) {
          const docId = teacher.teachersId || teacher.idUnik || teacher.nip || teacher.id || '';
          const patchedTeacher = transformTeacherToV2(teacher, docId);
          teachersToUpdate.push(patchedTeacher);
          patchedTeachersCount++;
        }
      }

      if (teachersToUpdate.length > 0) {
        console.log(
          `[localSchemaPatchService] Patching ${teachersToUpdate.length} legacy teachers records to V2...`,
        );
        await localDb.teachers.bulkPut(teachersToUpdate);
      }

      // 4. Update the schema version setting
      await localDb.systemSettings.put({
        key: 'local_schema_version',
        value: CURRENT_LOCAL_SCHEMA_VERSION,
        lastUpdated: Date.now(),
      });

      console.log(
        `✅ [localSchemaPatchService] Local schema patching completed. Patched students: ${patchedStudentsCount}, teachers: ${patchedTeachersCount}.`,
      );
      if (onProgress) onProgress('Migrasi skema data lokal selesai sukses.');

      // Dispatch event to notify listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('emam:local_schema_patched', {
            detail: { patchedStudentsCount, patchedTeachersCount },
          }),
        );
      }

      return {
        success: true,
        patchedStudents: patchedStudentsCount,
        patchedTeachers: patchedTeachersCount,
      };
    } catch (error) {
      console.error('[localSchemaPatchService] Failed to patch local schemas:', error);
      return { success: false, patchedStudents: 0, patchedTeachers: 0 };
    }
  },

  /**
   * Helper to check if any records are missing V2 nested structures.
   */
  async checkForOutdatedRecords(): Promise<boolean> {
    try {
      // Check student records
      const sampleStudents = await localDb.students.limit(20).toArray();
      for (const s of sampleStudents) {
        if (!s.sistemJangkar || !s.kontakDanWali || !s.logPoinKedisiplinan) {
          return true;
        }
      }

      // Check teacher records
      const sampleTeachers = await localDb.teachers.limit(20).toArray();
      for (const t of sampleTeachers) {
        if (!t.sistemJangkar || !t.jabatanDanStatus || !t.penugasanAkademik) {
          return true;
        }
      }

      return false;
    } catch (e) {
      console.warn('[localSchemaPatchService] Error checking for outdated records:', e);
      return false;
    }
  },
};

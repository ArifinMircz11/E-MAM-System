import { db } from '@/database/dexie';
import { mapLegacyStudent } from '../mappers/masterMapper';
import legacyData from '../../../../docs/migration/firestore-full-export.json';

export async function importStudents(): Promise<{ successCount: number; errorCount: number }> {
  console.log('[Migration] Starting importStudents...');
  let successCount = 0;
  let errorCount = 0;

  try {
    const rawStudents = (legacyData as any).students || [];
    const mappedStudents: any[] = [];

    for (const raw of rawStudents) {
      try {
        const mapped = mapLegacyStudent(raw);
        mappedStudents.push(mapped);
        successCount++;
      } catch (err) {
        console.error('[Migration] Failed to map student:', raw, err);
        errorCount++;
      }
    }

    if (mappedStudents.length > 0) {
      await db.students.bulkPut(mappedStudents);
    }

    console.log(`[Migration] importStudents completed. Success: ${successCount}, Errors: ${errorCount}`);
    return { successCount, errorCount };
  } catch (err) {
    console.error('[Migration] Critical error in importStudents:', err);
    throw err;
  }
}

import { db } from '@/database/dexie';
import { mapLegacyClass, mapLegacyAcademicYear } from '../mappers/academicMapper';
import legacyData from '../../../../docs/migration/firestore-full-export.json';

export async function importClasses(): Promise<{ successCount: number; errorCount: number }> {
  console.log('[Migration] Starting importClasses...');
  let successCount = 0;
  let errorCount = 0;

  try {
    // 1. Academic Years
    const rawAcademicYears = (legacyData as any).academic_years || [];
    const mappedAcademicYears: any[] = [];
    for (const raw of rawAcademicYears) {
      try {
        const mapped = mapLegacyAcademicYear(raw);
        mappedAcademicYears.push(mapped);
      } catch (err) {
        console.error('[Migration] Failed to map academic year:', raw, err);
      }
    }
    if (mappedAcademicYears.length > 0) {
      await db.academic_years.bulkPut(mappedAcademicYears);
    }

    // 2. Classes
    const rawClasses = (legacyData as any).classes || [];
    const mappedClasses: any[] = [];

    for (const raw of rawClasses) {
      try {
        const mapped = mapLegacyClass(raw);
        mappedClasses.push(mapped);
        successCount++;
      } catch (err) {
        console.error('[Migration] Failed to map class:', raw, err);
        errorCount++;
      }
    }

    if (mappedClasses.length > 0) {
      await db.classes.bulkPut(mappedClasses);
    }

    console.log(`[Migration] importClasses completed. Success: ${successCount}, Errors: ${errorCount}`);
    return { successCount, errorCount };
  } catch (err) {
    console.error('[Migration] Critical error in importClasses:', err);
    throw err;
  }
}

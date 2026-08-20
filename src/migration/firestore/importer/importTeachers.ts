import { db } from '@/database/dexie';
import { mapLegacyTeacher } from '../mappers/masterMapper';
import legacyData from '../../../../docs/migration/firestore-full-export.json';

export async function importTeachers(): Promise<{ successCount: number; errorCount: number }> {
  console.log('[Migration] Starting importTeachers...');
  let successCount = 0;
  let errorCount = 0;

  try {
    const rawTeachers = (legacyData as any).teachers || [];
    const mappedTeachers: any[] = [];

    for (const raw of rawTeachers) {
      try {
        const tenantId = raw.tenantId || 'madrasah_al_ikhlas';
        const mapped = mapLegacyTeacher(raw, tenantId);
        mappedTeachers.push(mapped);
        successCount++;
      } catch (err) {
        console.error('[Migration] Failed to map teacher:', raw, err);
        errorCount++;
      }
    }

    if (mappedTeachers.length > 0) {
      await db.teachers.bulkPut(mappedTeachers);
    }

    console.log(`[Migration] importTeachers completed. Success: ${successCount}, Errors: ${errorCount}`);
    return { successCount, errorCount };
  } catch (err) {
    console.error('[Migration] Critical error in importTeachers:', err);
    throw err;
  }
}

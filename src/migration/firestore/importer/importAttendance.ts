import { db } from '@/database/dexie';
import { mapLegacyAttendance } from '../mappers/attendanceMapper';
import legacyData from '../../../../docs/migration/firestore-full-export.json';

export async function importAttendance(): Promise<{ successCount: number; errorCount: number }> {
  console.log('[Migration] Starting importAttendance...');
  let successCount = 0;
  let errorCount = 0;

  try {
    const rawAttendance = (legacyData as any).attendance || [];
    const mappedAttendance: any[] = [];

    for (const raw of rawAttendance) {
      try {
        const mapped = mapLegacyAttendance(raw);
        mappedAttendance.push(mapped);
        successCount++;
      } catch (err) {
        console.error('[Migration] Failed to map attendance:', raw, err);
        errorCount++;
      }
    }

    if (mappedAttendance.length > 0) {
      await db.attendance.bulkPut(mappedAttendance);
    }

    console.log(`[Migration] importAttendance completed. Success: ${successCount}, Errors: ${errorCount}`);
    return { successCount, errorCount };
  } catch (err) {
    console.error('[Migration] Critical error in importAttendance:', err);
    throw err;
  }
}

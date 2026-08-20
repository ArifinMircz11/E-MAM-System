import { db } from '@/database/dexie';
import { mapLegacyPoint } from '../mappers/pointMapper';
import legacyData from '../../../../docs/migration/firestore-full-export.json';

export async function importPoints(): Promise<{ successCount: number; errorCount: number }> {
  console.log('[Migration] Starting importPoints...');
  let successCount = 0;
  let errorCount = 0;

  try {
    const rawPoints = (legacyData as any).point_records || (legacyData as any).poin || (legacyData as any).points || [];
    const mappedPoints: any[] = [];

    for (const raw of rawPoints) {
      try {
        const mapped = mapLegacyPoint(raw);
        mappedPoints.push(mapped);
        successCount++;
      } catch (err) {
        console.error('[Migration] Failed to map point:', raw, err);
        errorCount++;
      }
    }

    if (mappedPoints.length > 0) {
      await db.points.bulkPut(mappedPoints);
    }

    console.log(`[Migration] importPoints completed. Success: ${successCount}, Errors: ${errorCount}`);
    return { successCount, errorCount };
  } catch (err) {
    console.error('[Migration] Critical error in importPoints:', err);
    throw err;
  }
}

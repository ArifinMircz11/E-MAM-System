import { db } from '@/database/dexie';
import { mapLegacyUser } from '../mappers/identityMapper';
import legacyData from '../../../../docs/migration/firestore-full-export.json';

export async function importUsers(): Promise<{ successCount: number; errorCount: number }> {
  console.log('[Migration] Starting importUsers...');
  let successCount = 0;
  let errorCount = 0;

  try {
    const rawUsers = (legacyData as any).users || [];
    const mappedUsers: any[] = [];

    for (const raw of rawUsers) {
      try {
        const { userAccount } = mapLegacyUser(raw);
        
        // Enrich userAccount with roles and role from the raw model for compatibility
        const roles = raw.roles || (raw.role ? [raw.role] : ['GURU']);
        const role = raw.role || 'guru';
        
        const finalUser = {
          ...userAccount,
          role: role.toLowerCase() as any,
          roles: roles.map((r: string) => r.toLowerCase() as any),
          studentsId: raw.studentsId || undefined,
          teachersId: raw.teachersId || undefined,
        };

        mappedUsers.push(finalUser);
        successCount++;
      } catch (err) {
        console.error('[Migration] Failed to map user:', raw, err);
        errorCount++;
      }
    }

    if (mappedUsers.length > 0) {
      // Use Dexie bulkPut to store
      await db.users.bulkPut(mappedUsers);
    }

    console.log(`[Migration] importUsers completed. Success: ${successCount}, Errors: ${errorCount}`);
    return { successCount, errorCount };
  } catch (err) {
    console.error('[Migration] Critical error in importUsers:', err);
    throw err;
  }
}

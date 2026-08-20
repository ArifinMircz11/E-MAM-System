import { db } from '@/database/dexie';
import type { User } from '@/domain/entities/user';

/**
 * AuthRepository
 *
 * Specifically handles Dexie operations related to Authentication where
 * a SecurityContext is not yet established.
 *
 * ARCHITECTURAL EXCEPTION: This repository does NOT extend BaseRepository 
 * because it handles sensitive local-only credentials (password hashes) 
 * that MUST NOT be synced to Firestore via SyncEngine.
 */
export class AuthRepository {
  /**
   * Find a user offline using their login identifier
   */
  async findOfflineUser(identifier: string): Promise<User | null> {
    const idTrimmed = identifier.trim();
    const idNormalized = idTrimmed.toUpperCase();
    const idLower = idTrimmed.toLowerCase();

    return (
      (await db
        .table('users')
        .filter(
          (u: any) =>
            u.email?.toLowerCase() === idLower ||
            u.idUnik === idTrimmed ||
            u.idUnik === idNormalized ||
            u.idUnik === idLower ||
            u.nip === idTrimmed ||
            u.nik === idTrimmed,
        )
        .first()) || null
    );
  }

  /**
   * Cache user credentials for offline login support.
   * Direct Dexie write because we need to bypass SyncQueue for password hashes.
   * Password hashes should NOT be synced to Firestore via SyncEngine!
   */
  async cacheOfflineCredentials(userData: any, passwordHash: string): Promise<void> {
    const id = userData.id || userData.uid;
    const existing = (await db.table('users').get(id)) || {};

    // Merge to preserve other fields, specifically saving the passwordHash locally
    await db.table('users').put({
      ...existing,
      ...userData,
      id,
      passwordHash,
      updatedAt: Date.now(),
    });
  }
}

export const authRepository = new AuthRepository();

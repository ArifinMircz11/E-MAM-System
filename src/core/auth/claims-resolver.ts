import { CanonicalUser } from './canonical-user';
import { localDb } from '@/database/dexie';

/**
 * CLAIMS RESOLVER
 * 
 * Bertanggung jawab untuk memetakan data mentah (Firebase Claims, Firestore User Doc)
 * menjadi model CanonicalUser yang terstandarisasi.
 */

export class ClaimsResolver {
  /**
   * Resolve CanonicalUser dari data local (Dexie).
   * Digunakan untuk skenario Offline-First.
   */
  static async resolveFromLocal(uid: string): Promise<CanonicalUser | null> {
    try {
      const userDoc = await localDb.users.get(uid);
      if (!userDoc) return null;

      return this.mapToCanonical(userDoc);
    } catch (error) {
      console.error('[ClaimsResolver] Resolve from local failed:', error);
      return null;
    }
  }

  /**
   * Memetakan dokumen user (dari Firestore/Dexie) ke CanonicalUser.
   */
  static mapToCanonical(data: any): CanonicalUser {
    const roles = Array.isArray(data.roles) ? data.roles : [data.role || 'GUEST'];
    const permissions = Array.isArray(data.permissions) ? data.permissions : [];
    
    // Heuristic untuk menentukan organizationType
    let orgType: 'DEVELOPER' | 'KANWIL' | 'KEMENAG' | 'MADRASAH' = 'MADRASAH';
    if (roles.includes('DEVELOPER')) orgType = 'DEVELOPER';
    else if (roles.includes('KANWIL')) orgType = 'KANWIL';
    else if (roles.includes('KEMENAG')) orgType = 'KEMENAG';

    // Heuristic untuk accountType
    let accountType: any = data.accountType || 'STAFF';
    if (roles.includes('DEVELOPER')) accountType = 'DEVELOPER';
    else if (roles.includes('ADMIN')) accountType = 'ADMIN';
    else if (roles.includes('SISWA') || roles.includes('STUDENT')) accountType = 'STUDENT';
    else if (roles.includes('GURU') || roles.includes('TEACHER')) accountType = 'TEACHER';

    return {
      uid: data.uid || data.id,
      tenantId: data.tenantId || 'default',
      organizationId: data.organizationId || data.tenantId || 'default',
      organizationType: orgType,
      accountType: accountType,
      roles: roles,
      permissions: permissions,
      scopes: data.scopes || [{ type: orgType, id: data.organizationId || data.tenantId || 'default' }],
      status: (data.status || 'ACTIVE').toUpperCase() as any,
      profile: {
        name: data.displayName || data.name || 'User',
        email: data.email || '',
        phoneNumber: data.phoneNumber || data.phone,
        photoURL: data.photoURL,
        identityNumber: data.idUnik || data.nisn || data.nip,
      },
      metadata: data.metadata || {}
    };
  }
}

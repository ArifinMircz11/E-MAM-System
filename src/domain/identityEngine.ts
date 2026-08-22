/**
 * IDENTITY ENGINE
 * Mengelola logic RBAC dan provisioning akses berbasis data profil dan relasi sistem.
 *
 * Cloud access is intentionally routed through FirestoreGateway.
 */
import { firestoreGateway } from '@/services/gateways/FirestoreGateway';

export const IdentityEngine = {
  async provisionAccess(uid: string, userData: Record<string, any>) {
    console.log(`[IdentityEngine] Provisioning access for: ${uid}`, userData);

    const currentRole = String(userData.role || '').toLowerCase();
    const privilegedRoles = ['guru', 'admin', 'staf', 'kepala_madrasah', 'developer', 'bendahara', 'sarpras', 'kepala_tu', 'orang_tua'];
    if (privilegedRoles.includes(currentRole)) {
      console.log(`[IdentityEngine] User ${uid} already has privileged role ${currentRole}, skipping student overwrite.`);
      return;
    }

    let studentData: any = null;
    try {
      const studentsRef = firestoreGateway.collection(firestoreGateway.db, 'students');
      const q = firestoreGateway.query(
        studentsRef,
        firestoreGateway.where('sistemJangkar.userId', '==', uid),
      );
      const studentSnapshot = await firestoreGateway.getDocs(q);

      if (!studentSnapshot.empty) {
        studentData = studentSnapshot.docs[0].data();
      }
    } catch (e) {
      console.error('Error fetching student relation:', e);
    }

    let newRole = userData.accountType || 'user';

    if (studentData) {
      newRole = 'siswa';
    } else if (
      userData.accountType === 'teacher' ||
      (userData.nik && userData.nik.startsWith('GTK'))
    ) {
      newRole = 'guru';
    }

    await firestoreGateway.updateDoc(
      firestoreGateway.doc(firestoreGateway.db, 'users', uid),
      {
        role: newRole,
        provisionedAt: Date.now(),
        academicKey: studentData?.studentsId || null,
        metadataAkademik: studentData?.metadataAkademik || {},
      },
    );

    console.log(`[IdentityEngine] Provisioned role: ${newRole} for user: ${uid}`);
  },
};

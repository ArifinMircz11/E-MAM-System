/**
 * IDENTITY ENGINE
 * Mengelola logic RBAC dan provisioning akses berbasis data profil dan relasi sistem.
 */
import { db, doc, updateDoc, collection, query, where, getDocs } from '@/services/dbGateway';

export const IdentityEngine = {
  async provisionAccess(uid: string, userData: Record<string, any>) {
    console.log(`[IdentityEngine] Provisioning access for: ${uid}`, userData);

    const currentRole = String(userData.role || '').toLowerCase();
    const privilegedRoles = ['guru', 'admin', 'staf', 'kepala_madrasah', 'developer', 'bendahara', 'sarpras', 'kepala_tu', 'orang_tua'];
    if (privilegedRoles.includes(currentRole)) {
      console.log(`[IdentityEngine] User ${uid} already has privileged role ${currentRole}, skipping student overwrite.`);
      return;
    }

    // 1. Fetch relational data from 'students' collection
    let studentData: any = null;
    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('sistemJangkar.userId', '==', uid));
      const studentSnapshot = await getDocs(q);

      if (!studentSnapshot.empty) {
        studentData = studentSnapshot.docs[0].data();
      }
    } catch (e) {
      console.error('Error fetching student relation:', e);
    }

    // 2. Complex RBAC provisioning logic
    let newRole = userData.accountType || 'user';

    if (studentData) {
      // If student relation found, strictly enforce student role
      newRole = 'siswa';
    } else if (
      userData.accountType === 'teacher' ||
      (userData.nik && userData.nik.startsWith('GTK'))
    ) {
      newRole = 'guru';
    }

    // 3. Update role and enriched data in DB
    await updateDoc(doc(db, 'users', uid), {
      role: newRole,
      provisionedAt: Date.now(),
      academicKey: studentData?.studentsId || null,
      metadataAkademik: studentData?.metadataAkademik || {},
    });

    console.log(`[IdentityEngine] Provisioned role: ${newRole} for user: ${uid}`);
  },
};

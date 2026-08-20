import { Router } from 'express';
import admin, { getAdminDb, adminAuth } from '../../src/lib/firebase-admin';

const router = Router();

/**
 * Middleware to verify admin token and role
 */
const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const adminDb = getAdminDb();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // --- ADMIN ROLE VERIFICATION ---
    // We try Firestore first, but we add an email fallback to ensure the owner is never locked out
    // even if Firestore Admin SDK has permission issues.

    const bypassEmails = ['ptspmanhst@gmail.com', 'dgt.3652@gmail.com', 'tuman1hst@gmail.com'].map(
      (e) => e.toLowerCase(),
    );

    const userEmail = (decodedToken.email || '').toLowerCase();
    const isBypassed = bypassEmails.includes(userEmail);

    console.log(`[AUTH] Verifying token for: ${userEmail} - Bypassed: ${isBypassed}`);

    if (isBypassed) {
      console.log(`[AUTH] Admin bypass granted for ${decodedToken.email}`);
      req.user = decodedToken;
      return next();
    }

    try {
      // Verify admin role from Firestore (Trusted source)
      const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();

      if (!adminDoc.exists) {
        // Secondary check: user role in users collection
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        if (!userDoc.exists || (userData?.role !== 'admin' && userData?.role !== 'developer')) {
          console.warn(`[AUTH] Access denied for ${decodedToken.email}: role mismatch`);
          return res
            .status(403)
            .json({ success: false, message: 'Forbidden: Admin/Developer access required' });
        }
      }
    } catch (dbError: any) {
      console.error(`[AUTH] Firestore DB Check Error for ${decodedToken.email}:`, dbError.message);
      // This is the PERMISSION_DENIED we see.
      // If the DB check fails but the token is valid, and NOT the owner, we have to deny
      // because we can't verify their role.
      return res.status(503).json({
        success: false,
        message:
          'Internal authorization service unavailable. Please check backend Firestore permissions.',
        debug: dbError.message,
      });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth Verification Error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * POST /api/developer/admin/activate-user
 * Unified activation logic for Admin to activate accounts for Teachers, Students, and others.
 * Following e-Mam System RBAC and Storage-Less (Base64) architecture.
 */
router.post('/activate-user', verifyAdmin, async (req, res) => {
  const adminDb = getAdminDb();

  try {
    const {
      email,
      password,
      displayName,
      role,
      linkId,
      idUnik,
      type, // 'student' | 'teacher' | 'other'
      photoBase64,
      tenantId,
    } = req.body;

    if (!email || !role || !displayName) {
      return res
        .status(400)
        .json({ success: false, message: 'Email, Role, and Name are required.' });
    }

    // 1. Manage Firebase Auth User
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      // If user exists, we might need to update password if provided
      if (password) {
        await adminAuth.updateUser(userRecord.uid, { password: password });
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email,
          password: password || 'Madrasah2026!',
          displayName,
          emailVerified: true,
        });
      } else {
        throw e;
      }
    }

    const uid = userRecord.uid;
    const batch = adminDb.batch();

    // 2. Prepare User Profile Doc
    const userRef = adminDb.collection('users').doc(uid);
    const userPayload: any = {
      uid,
      displayName,
      email: email.toLowerCase(),
      role: role.toLowerCase(),
      peran: role.toLowerCase(), // e-Mam System legacy support
      idUnik: idUnik || '',
      tenantId: tenantId || '30315537', // Unified multi-tenant tracking
      isActive: true,
      accountStatus: 'Active',
      isClaimed: true,
      isAccountClaimed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activatedBy: (req as any).user.uid,
      isSso: false,
    };

    if (photoBase64) {
      userPayload.photoURL = photoBase64; // Storage-Less implementation
    }

    if (type === 'student' && linkId) {
      userPayload.studentId = linkId;
      const studentRef = adminDb.collection('students').doc(linkId);
      batch.update(studentRef, {
        isClaimed: true,
        authUid: uid,
        linkedUserId: uid,
        email: email.toLowerCase(),
        accountStatus: 'Active',
        tenantId: tenantId || '30315537',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (type === 'teacher' && linkId) {
      userPayload.teacherId = linkId;
      const teacherRef = adminDb.collection('teachers').doc(linkId);
      batch.update(teacherRef, {
        isClaimed: true,
        authUid: uid,
        linkedUserId: uid,
        email: email.toLowerCase(),
        accountStatus: 'Active',
        tenantId: tenantId || '30315537',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    batch.set(userRef, userPayload, { merge: true });

    // 3. Audit Log
    const logRef = adminDb.collection('login_logs').doc();
    batch.set(logRef, {
      userId: uid,
      action: 'ADMIN_ACTIVATE_USER',
      timestamp: new Date().toISOString(),
      details: `Account activated by admin: ${displayName} as ${role}`,
      executedBy: (req as any).user.uid,
    });

    await batch.commit();

    res.json({
      success: true,
      message: `Berhasil mengaktifkan akun untuk ${displayName}`,
      uid: uid,
    });
  } catch (error: any) {
    console.error('Admin Activate User Error:', error);

    // Handle specific "Identity Toolkit API disabled" error
    if (error.message && error.message.includes('identitytoolkit.googleapis.com')) {
      return res.status(503).json({
        success: false,
        message:
          'Fitur Admin Auth belum siap: Identity Toolkit API perlu diaktifkan di Google Cloud Console. Silakan buka link ini dan tekan tombol ENABLE: https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=233376946516',
        errorCode: 'SERVICE_DISABLED',
      });
    }

    res.status(500).json({
      success: false,
      message:
        error.code === 'auth/email-already-exists'
          ? 'Email sudah digunakan.'
          : 'Gagal memproses aktivasi akun.',
      error: error.message,
    });
  }
});

/**
 * POST /api/developer/admin/reset-teacher-auth
 * Force reset teacher password and reactivate account
 */
router.post('/reset-teacher-auth', verifyAdmin, async (req, res) => {
  const adminDb = getAdminDb();
  try {
    const { teacherId, newPassword } = req.body;

    if (!teacherId || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: 'Teacher ID and new password are required' });
    }

    // Find teacher by document ID (UID) or idUnik
    let targetUid = teacherId;
    const teacherDoc = await adminDb.collection('teachers').doc(teacherId).get();

    if (!teacherDoc.exists) {
      // Search by idUnik
      const query = await adminDb
        .collection('teachers')
        .where('idUnik', '==', teacherId)
        .limit(1)
        .get();
      if (query.empty) {
        return res
          .status(404)
          .json({
            success: false,
            message: 'Identitas Guru (idUnik) tidak ditemukan di database.',
          });
      }
      targetUid = query.docs[0].id;
    }

    try {
      // 1. Force update Firebase Auth password (or create if not found)
      try {
        await adminAuth.updateUser(targetUid, {
          password: newPassword,
          disabled: false, // Ensure account is not disabled
        });
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found') {
          // Create the user
          const email = teacherDoc.exists ? teacherDoc.data()?.email : undefined;
          await adminAuth.createUser({
            uid: targetUid,
            password: newPassword,
            email: email,
            disabled: false,
          });
        } else {
          throw authErr;
        }
      }

      // 2. Synchronize with Firestore
      const batch = adminDb.batch();
      const teacherRef = adminDb.collection('teachers').doc(targetUid);
      const userRef = adminDb.collection('users').doc(targetUid);

      const syncData = {
        statusAkun: 'Active',
        accountStatus: 'Active',
        isAccountClaimed: true,
        isClaimed: true,
        mustChangePassword: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastAdminAction: {
          type: 'FORCE_RESET',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          adminUid: (req as any).user.uid,
        },
      };

      batch.update(teacherRef, syncData);

      // Check if user entry exists to update
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        batch.update(userRef, {
          statusAkun: 'Active',
          accountStatus: 'Active',
          isAccountClaimed: true,
          isClaimed: true,
          mustChangePassword: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        let teacherData: any = {};
        if (teacherDoc.exists) {
          teacherData = teacherDoc.data();
        } else {
          const query = await adminDb
            .collection('teachers')
            .where('idUnik', '==', teacherId)
            .limit(1)
            .get();
          if (!query.empty) teacherData = query.docs[0].data();
        }

        batch.set(userRef, {
          email: teacherData.email || '',
          name: teacherData.name || teacherData.namaLengkap || 'Guru',
          role: teacherData.jabatan || 'guru',
          idUnik: teacherData.idUnik || '',
          statusAkun: 'Active',
          accountStatus: 'Active',
          isAccountClaimed: true,
          isClaimed: true,
          mustChangePassword: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      res.json({
        success: true,
        message:
          'Akun guru berhasil diaktifkan kembali. Berikan password sementara ke guru bersangkutan.',
        tempPassword: newPassword,
      });
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: 'Email guru belum terdaftar di sistem Auth. Silakan buatkan akun baru.',
        });
      }
      throw authError;
    }
  } catch (error: any) {
    console.error('Admin Force Reset Error:', error);

    // Handle specific "Identity Toolkit API disabled" error
    if (error.message && error.message.includes('identitytoolkit.googleapis.com')) {
      return res.status(503).json({
        success: false,
        message:
          'Fitur Admin Auth belum siap: Identity Toolkit API perlu diaktifkan di Google Cloud Console. Silakan buka link ini dan tekan tombol ENABLE: https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=233376946516',
        errorCode: 'SERVICE_DISABLED',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat memperbarui akun.',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/developer/admin/delete-user
 * Menghapus user dari Firebase Auth dan terkait di Firestore
 */
router.delete('/delete-user/:uid', verifyAdmin, async (req, res) => {
  const adminDb = getAdminDb();
  try {
    const targetUid = req.params.uid;
    if (!targetUid) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // 1. Get user data from Firestore before deleting
    const userRef = adminDb.collection('users').doc(targetUid);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // 2. Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(targetUid);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr;
      }
      // If not found in Auth but exists in DB, proceed to delete from DB
    }

    // 3. Delete from Firestore
    const batch = adminDb.batch();
    batch.delete(userRef);

    // If they had linked roles, un-claim them
    if (userData?.role === 'siswa' || userData?.role === 'Siswa' || userData?.studentsId) {
      const studentId = userData.studentsId || userData.idUnik || targetUid;
      const studentRef = adminDb.collection('students').doc(studentId);
      const studentDoc = await studentRef.get();
      if (studentDoc.exists) {
        batch.update(studentRef, {
          isClaimed: false,
          authUid: admin.firestore.FieldValue.delete(),
          linkedUserId: admin.firestore.FieldValue.delete(),
          email: admin.firestore.FieldValue.delete(),
          accountStatus: 'Inactive',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else if (
      (userData?.role &&
        ['guru', 'wali_kelas', 'kepala_madrasah'].includes(userData.role.toLowerCase())) ||
      userData?.teachersId
    ) {
      const teacherId = userData.teachersId || userData.idUnik || targetUid;
      const teacherRef = adminDb.collection('teachers').doc(teacherId);
      const teacherDoc = await teacherRef.get();
      if (teacherDoc.exists) {
        batch.update(teacherRef, {
          isClaimed: false,
          authUid: admin.firestore.FieldValue.delete(),
          linkedUserId: admin.firestore.FieldValue.delete(),
          accountStatus: 'Inactive',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    // 4. Audit Log
    const logRef = adminDb.collection('login_logs').doc();
    batch.set(logRef, {
      userId: targetUid,
      action: 'ADMIN_DELETE_USER',
      timestamp: new Date().toISOString(),
      details: `Account deleted by admin. Email: ${userData?.email || 'Unknown'}`,
      executedBy: (req as any).user.uid,
    });

    await batch.commit();

    res.json({ success: true, message: 'Berhasil menghapus akun' });
  } catch (error: any) {
    console.error('Admin Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus akun',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/debug-auth
 * Debug endpoint to check auth status and claims
 */
router.get('/debug-auth', async (req: any, res: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No bearer token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    res.json({
      success: true,
      email: decodedToken.email,
      uid: decodedToken.uid,
      isOwner: decodedToken.email === 'ptspmanhst@gmail.com',
      claims: decodedToken,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/teachers
 * List all teachers for management
 */
router.get('/teachers', verifyAdmin, async (req, res) => {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection('teachers').orderBy('namaLengkap', 'asc').get();
    const teachers = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
    }));
    res.json({ success: true, teachers });
  } catch (error) {
    console.error('Fetch Teachers Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data guru.' });
  }
});

export default router;

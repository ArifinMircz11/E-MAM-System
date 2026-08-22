import { Router } from 'express';
import admin, { getAdminDb, adminAuth } from '../../src/lib/firebase-admin';

const router = Router();

/**
 * Privileged API boundary.
 * Authentication comes only from a verified Firebase ID token.
 * Authorization comes only from trusted admin/users documents keyed by token UID.
 * Client-provided email, tenant, role, or requester headers are never authority.
 */
const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const adminDb = getAdminDb();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    try {
      const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.exists ? userDoc.data() : undefined;

      const isAdminDocument = adminDoc.exists;
      const role = String(userData?.role || '').toLowerCase();
      const isPrivilegedRole = role === 'admin' || role === 'developer';

      if (!isAdminDocument && !isPrivilegedRole) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Admin/Developer access required',
        });
      }

      const tenantId = String(userData?.tenantId || '').trim();
      if (!tenantId || ['global', 'default', 'unknown'].includes(tenantId.toLowerCase())) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: canonical tenant scope is required',
        });
      }

      req.user = decodedToken;
      req.security = {
        uid: decodedToken.uid,
        tenantId,
        role,
        isAdminDocument,
      };
      return next();
    } catch (dbError: any) {
      console.error(`[AUTH] Admin authorization lookup failed:`, dbError.message);
      return res.status(503).json({
        success: false,
        message: 'Authorization service unavailable.',
      });
    }
  } catch (error) {
    console.error('Auth Verification Error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

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
      type,
      photoBase64,
      tenantId,
    } = req.body;

    const requestedTenantId = String(tenantId || '').trim();
    if (!email || !role || !displayName || !requestedTenantId) {
      return res.status(400).json({
        success: false,
        message: 'Email, Role, Name, and Tenant ID are required.',
      });
    }

    if (requestedTenantId !== req.security.tenantId && req.security.role !== 'developer') {
      return res.status(403).json({ success: false, message: 'Tenant scope mismatch.' });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'A password must be explicitly supplied; no production default is permitted.',
      });
    }

    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(userRecord.uid, { password });
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email,
          password,
          displayName,
          emailVerified: false,
        });
      } else {
        throw e;
      }
    }

    const uid = userRecord.uid;
    const batch = adminDb.batch();
    const userRef = adminDb.collection('users').doc(uid);
    const userPayload: any = {
      uid,
      displayName,
      email: email.toLowerCase(),
      role: role.toLowerCase(),
      peran: role.toLowerCase(),
      idUnik: idUnik || '',
      tenantId: requestedTenantId,
      isActive: true,
      accountStatus: 'Active',
      isClaimed: true,
      isAccountClaimed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activatedBy: req.user.uid,
      isSso: false,
    };

    if (photoBase64) userPayload.photoURL = photoBase64;

    if (type === 'student' && linkId) {
      userPayload.studentId = linkId;
      batch.update(adminDb.collection('students').doc(linkId), {
        isClaimed: true,
        authUid: uid,
        linkedUserId: uid,
        email: email.toLowerCase(),
        accountStatus: 'Active',
        tenantId: requestedTenantId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (type === 'teacher' && linkId) {
      userPayload.teacherId = linkId;
      batch.update(adminDb.collection('teachers').doc(linkId), {
        isClaimed: true,
        authUid: uid,
        linkedUserId: uid,
        email: email.toLowerCase(),
        accountStatus: 'Active',
        tenantId: requestedTenantId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    batch.set(userRef, userPayload, { merge: true });
    batch.set(adminDb.collection('login_logs').doc(), {
      userId: uid,
      action: 'ADMIN_ACTIVATE_USER',
      timestamp: new Date().toISOString(),
      details: `Account activated by admin: ${displayName} as ${role}`,
      executedBy: req.user.uid,
      tenantId: requestedTenantId,
    });

    await batch.commit();
    return res.json({ success: true, message: `Berhasil mengaktifkan akun untuk ${displayName}`, uid });
  } catch (error: any) {
    console.error('Admin Activate User Error:', error);
    return res.status(500).json({
      success: false,
      message: error.code === 'auth/email-already-exists' ? 'Email sudah digunakan.' : 'Gagal memproses aktivasi akun.',
      error: error.message,
    });
  }
});

router.post('/reset-teacher-auth', verifyAdmin, async (req, res) => {
  const adminDb = getAdminDb();
  try {
    const { teacherId, newPassword } = req.body;
    if (!teacherId || !newPassword) {
      return res.status(400).json({ success: false, message: 'Teacher ID and new password are required' });
    }

    let targetUid = teacherId;
    let teacherDoc = await adminDb.collection('teachers').doc(teacherId).get();
    if (!teacherDoc.exists) {
      const query = await adminDb.collection('teachers').where('idUnik', '==', teacherId).limit(1).get();
      if (query.empty) return res.status(404).json({ success: false, message: 'Identitas Guru tidak ditemukan di database.' });
      targetUid = query.docs[0].id;
      teacherDoc = query.docs[0];
    }

    try {
      await adminAuth.updateUser(targetUid, { password: newPassword, disabled: false });
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') throw authErr;
      const email = teacherDoc.data()?.email;
      if (!email) return res.status(400).json({ success: false, message: 'Guru tidak memiliki email canonical.' });
      await adminAuth.createUser({ uid: targetUid, password: newPassword, email, disabled: false });
    }

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
        adminUid: req.user.uid,
      },
    };

    batch.update(teacherRef, syncData);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      batch.update(userRef, syncData);
    } else {
      const teacherData = teacherDoc.data() || {};
      batch.set(userRef, {
        uid: targetUid,
        email: teacherData.email || '',
        name: teacherData.name || teacherData.namaLengkap || 'Guru',
        role: teacherData.jabatan || 'guru',
        idUnik: teacherData.idUnik || '',
        tenantId: teacherData.tenantId || req.security.tenantId,
        ...syncData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    return res.json({
      success: true,
      message: 'Akun guru berhasil diaktifkan kembali.',
      uid: targetUid,
    });
  } catch (error: any) {
    console.error('Admin Force Reset Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat memperbarui akun.' });
  }
});

router.delete('/delete-user/:uid', verifyAdmin, async (req, res) => {
  const adminDb = getAdminDb();
  try {
    const targetUid = req.params.uid;
    if (!targetUid) return res.status(400).json({ success: false, message: 'User ID is required' });

    const userRef = adminDb.collection('users').doc(targetUid);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    if (userData?.tenantId && userData.tenantId !== req.security.tenantId && req.security.role !== 'developer') {
      return res.status(403).json({ success: false, message: 'Tenant scope mismatch.' });
    }

    try {
      await adminAuth.deleteUser(targetUid);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') throw authErr;
    }

    const batch = adminDb.batch();
    batch.delete(userRef);

    if (userData?.role?.toLowerCase() === 'siswa' || userData?.studentsId) {
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
    } else if ((userData?.role && ['guru', 'wali_kelas', 'kepala_madrasah'].includes(userData.role.toLowerCase())) || userData?.teachersId) {
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

    batch.set(adminDb.collection('login_logs').doc(), {
      userId: targetUid,
      action: 'ADMIN_DELETE_USER',
      timestamp: new Date().toISOString(),
      details: `Account deleted by admin. Email: ${userData?.email || 'Unknown'}`,
      executedBy: req.user.uid,
      tenantId: req.security.tenantId,
    });

    await batch.commit();
    return res.json({ success: true, message: 'Berhasil menghapus akun' });
  } catch (error: any) {
    console.error('Admin Delete User Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus akun' });
  }
});

router.get('/debug-auth', verifyAdmin, async (req: any, res: any) => {
  // Debug information is itself privileged and never exposes an owner/email bypass.
  return res.json({
    success: true,
    uid: req.security.uid,
    tenantId: req.security.tenantId,
    role: req.security.role,
  });
});

router.get('/teachers', verifyAdmin, async (req, res) => {
  const adminDb = getAdminDb();
  try {
    const snapshot = await adminDb.collection('teachers').where('tenantId', '==', req.security.tenantId).orderBy('namaLengkap', 'asc').get();
    const teachers = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
    return res.json({ success: true, teachers });
  } catch (error) {
    console.error('Fetch Teachers Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data guru.' });
  }
});

export default router;

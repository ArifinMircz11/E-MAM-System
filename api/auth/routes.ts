import { Router } from 'express';
import { getAdminAuth, getAdminDb } from '../../src/lib/firebase-admin.js';

const router = Router();

type CanonicalRole = 'siswa' | 'guru';

interface CanonicalUserWrite {
  id: string;
  uid: string;
  tenantId: string;
  accountType: 'madrasah';
  role: CanonicalRole;
  roles: string[];
  referenceId: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  status: 'aktif' | 'nonaktif';
  accountStatus: 'aktif' | 'nonaktif';
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
  deleted: boolean;
  isActive: boolean;
  isClaimed: boolean;
  isSso: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  schemaVersion: number;
  rbacVersion: number;
  version: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  permissions: string[];
  profile: { displayName: string; email: string; photoURL: string };
}

const logAuthError = (context: string, error: unknown) => {
  const normalizedError = error as { message?: string; code?: string; stack?: string };
  console.error(`[API_AUTH][${context}] FAIL:`, {
    message: normalizedError?.message,
    code: normalizedError?.code,
    stack: normalizedError?.stack?.split('\n').slice(0, 3).join('\n'),
  });
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizePhoneNumber = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value).trim();

const resolveTenantId = (entityData: Record<string, unknown> | undefined): string | null => {
  if (!entityData) return null;
  const tenantId = entityData.tenantId ?? entityData.scope ?? entityData.madrasahId ?? null;
  if (tenantId === null || tenantId === undefined) return null;
  const normalized = String(tenantId).trim();
  if (!normalized || ['global', 'default', 'unknown'].includes(normalized.toLowerCase())) return null;
  return normalized;
};

const resolveDisplayName = (entityData: Record<string, unknown> | undefined): string => {
  if (!entityData) return '';
  return String(
    entityData.displayName ?? entityData.namaLengkap ?? entityData.name ?? entityData.nama ?? '',
  ).trim();
};

const resolvePhoneNumber = (entityData: Record<string, unknown> | undefined): string =>
  normalizePhoneNumber(
    entityData?.phoneNumber ?? entityData?.phone ?? entityData?.noHp ?? entityData?.telepon ?? '',
  );

const resolvePhotoURL = (entityData: Record<string, unknown> | undefined): string =>
  String(entityData?.photoURL ?? entityData?.photoUrl ?? '').trim();

/**
 * Anonymous provisioning actor.
 *
 * This is intentionally a fixed server provenance value. Client headers are
 * never consulted for actor identity. Privileged activation must use a
 * separately authenticated admin route.
 */
const SYSTEM_ACTOR_UID = 'system';

const buildCanonicalUser = ({
  uid,
  tenantId,
  role,
  referenceId,
  displayName,
  email,
  phoneNumber,
  photoURL,
  existingUser,
}: {
  uid: string;
  tenantId: string;
  role: CanonicalRole;
  referenceId: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  existingUser?: Record<string, unknown>;
}): CanonicalUserWrite => {
  const now = Date.now();
  const createdAt = typeof existingUser?.createdAt === 'number' ? existingUser.createdAt : now;
  const existingVersion = typeof existingUser?.version === 'number' ? existingUser.version : 0;

  return {
    id: uid,
    uid,
    tenantId,
    accountType: 'madrasah',
    role,
    roles: [role],
    referenceId,
    displayName,
    email,
    phoneNumber,
    photoURL,
    status: 'aktif',
    accountStatus: 'aktif',
    createdAt,
    updatedAt: now,
    createdBy: typeof existingUser?.createdBy === 'string' ? existingUser.createdBy : SYSTEM_ACTOR_UID,
    updatedBy: SYSTEM_ACTOR_UID,
    deleted: false,
    isActive: true,
    isClaimed: true,
    isSso: false,
    approvalStatus:
      existingUser?.approvalStatus === 'approved'
        ? 'approved'
        : existingUser?.approvalStatus === 'rejected'
          ? 'rejected'
          : 'pending',
    schemaVersion: 17,
    rbacVersion: 2,
    version: existingVersion + 1,
    syncStatus: 'pending',
    permissions: Array.isArray(existingUser?.permissions)
      ? existingUser.permissions.filter((permission): permission is string => typeof permission === 'string')
      : [],
    profile: { displayName, email, photoURL },
  };
};

router.post('/claim', async (req, res) => {
  const { idUnik, email, password, nisn } = req.body;

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    if (!idUnik || !email || !password) {
      return res.status(400).json({ success: false, message: 'ID Unik, Email, and Password are required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const studentRef = db.collection('students').doc(String(idUnik));
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists) {
      return res.status(404).json({ success: false, message: 'ID Unik tidak ditemukan di database siswa.' });
    }

    const studentData = (studentSnap.data() as Record<string, unknown> | undefined) ?? {};
    if (nisn && studentData.nisn && String(studentData.nisn) !== String(nisn)) {
      return res.status(401).json({ success: false, message: 'NISN tidak cocok dengan data yang terdaftar.' });
    }
    if (studentData.isClaimed === true) {
      return res.status(400).json({ success: false, message: 'Akun ini sudah diklaim sebelumnya.' });
    }

    const tenantId = resolveTenantId(studentData);
    if (!tenantId) {
      return res.status(422).json({ success: false, message: 'Tenant siswa tidak ditemukan. CanonicalUser membutuhkan tenantId.' });
    }

    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: normalizedEmail,
        password,
        displayName: resolveDisplayName(studentData),
        emailVerified: false,
      });
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar di sistem.' });
      }
      throw error;
    }

    const canonicalUser = buildCanonicalUser({
      uid: userRecord.uid,
      tenantId,
      role: 'siswa',
      referenceId: studentRef.id,
      displayName: resolveDisplayName(studentData),
      email: normalizedEmail,
      phoneNumber: resolvePhoneNumber(studentData),
      photoURL: resolvePhotoURL(studentData),
    });

    const batch = db.batch();
    const canonicalUserRef = db.collection('users').doc(canonicalUser.id);
    batch.set(canonicalUserRef, canonicalUser, { merge: false });
    batch.update(studentRef, {
      isClaimed: true,
      authUid: userRecord.uid,
      linkedUserId: userRecord.uid,
      email: normalizedEmail,
      lastModified: Date.now(),
    });
    batch.set(db.collection('login_logs').doc(), {
      userId: userRecord.uid,
      userEmail: normalizedEmail,
      tenantId,
      action: 'CLAIM_ACCOUNT',
      timestamp: Date.now(),
      details: `Student account claimed: ${canonicalUser.displayName}`,
      referenceId: studentRef.id,
      role: 'siswa',
      executedBy: SYSTEM_ACTOR_UID,
    });

    await batch.commit();
    return res.json({
      success: true,
      message: 'Akun berhasil diklaim. Silakan masuk menggunakan email dan password Anda.',
      uid: userRecord.uid,
      canonicalUser: {
        id: canonicalUser.id,
        uid: canonicalUser.uid,
        tenantId: canonicalUser.tenantId,
        accountType: canonicalUser.accountType,
        role: canonicalUser.role,
        roles: canonicalUser.roles,
        referenceId: canonicalUser.referenceId,
        displayName: canonicalUser.displayName,
        email: canonicalUser.email,
        phoneNumber: canonicalUser.phoneNumber,
        photoURL: canonicalUser.photoURL,
        status: canonicalUser.status,
      },
    });
  } catch (error: unknown) {
    logAuthError('claim', error);
    const normalizedError = error as { message?: string };
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses klaim akun.',
      error: process.env.NODE_ENV === 'development' ? normalizedError.message : undefined,
    });
  }
});

router.post('/teacher-activate', async (req, res) => {
  const { teacherId, email, role, password } = req.body;

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    if (!teacherId || !email) {
      return res.status(400).json({ success: false, message: 'Teacher ID and Email are required.' });
    }
    if (role && String(role).toLowerCase() !== 'guru') {
      return res.status(400).json({ success: false, message: 'Role tidak valid. Teacher activation hanya menghasilkan role guru.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password wajib diberikan untuk aktivasi akun guru.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const teacherRef = db.collection('teachers').doc(String(teacherId));
    const teacherSnap = await teacherRef.get();
    if (!teacherSnap.exists) return res.status(404).json({ success: false, message: 'Data Guru tidak ditemukan.' });

    const teacherData = (teacherSnap.data() as Record<string, unknown> | undefined) ?? {};
    const tenantId = resolveTenantId(teacherData);
    if (!tenantId) return res.status(422).json({ success: false, message: 'Tenant guru tidak ditemukan. CanonicalUser membutuhkan tenantId.' });

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(normalizedEmail);
    } catch (error: unknown) {
      const authError = error as { code?: string };
      if (authError.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: normalizedEmail,
          password,
          displayName: resolveDisplayName(teacherData),
          emailVerified: true,
        });
      } else {
        throw error;
      }
    }

    const canonicalUserRef = db.collection('users').doc(userRecord.uid);
    const existingCanonicalSnap = await canonicalUserRef.get();
    const existingCanonicalUser = existingCanonicalSnap.exists
      ? (existingCanonicalSnap.data() as Record<string, unknown>)
      : undefined;

    const canonicalUser = buildCanonicalUser({
      uid: userRecord.uid,
      tenantId,
      role: 'guru',
      referenceId: teacherRef.id,
      displayName: resolveDisplayName(teacherData),
      email: normalizedEmail,
      phoneNumber: resolvePhoneNumber(teacherData),
      photoURL: resolvePhotoURL(teacherData),
      existingUser: existingCanonicalUser,
    });

    const batch = db.batch();
    batch.set(canonicalUserRef, canonicalUser, { merge: false });
    batch.update(teacherRef, {
      isClaimed: true,
      authUid: userRecord.uid,
      linkedUserId: userRecord.uid,
      email: normalizedEmail,
      accountStatus: 'aktif',
      lastActivated: Date.now(),
      updatedAt: Date.now(),
    });
    batch.set(db.collection('login_logs').doc(), {
      userId: userRecord.uid,
      userEmail: normalizedEmail,
      tenantId,
      action: 'ADMIN_ACTIVATE_TEACHER',
      timestamp: Date.now(),
      details: `Teacher ${canonicalUser.displayName} activated.`,
      executedBy: SYSTEM_ACTOR_UID,
      referenceId: teacherRef.id,
      role: 'guru',
    });

    await batch.commit();
    return res.json({
      success: true,
      message: `Berhasil mengaktifkan akun untuk ${canonicalUser.displayName}`,
      uid: userRecord.uid,
      canonicalUser: {
        id: canonicalUser.id,
        uid: canonicalUser.uid,
        tenantId: canonicalUser.tenantId,
        accountType: canonicalUser.accountType,
        role: canonicalUser.role,
        roles: canonicalUser.roles,
        referenceId: canonicalUser.referenceId,
        displayName: canonicalUser.displayName,
        email: canonicalUser.email,
        phoneNumber: canonicalUser.phoneNumber,
        photoURL: canonicalUser.photoURL,
        status: canonicalUser.status,
      },
    });
  } catch (error: unknown) {
    logAuthError('teacher-activate', error);
    const normalizedError = error as { message?: string };
    return res.status(500).json({
      success: false,
      message: 'Gagal mengaktifkan akun guru.',
      error: process.env.NODE_ENV === 'development' ? normalizedError.message : undefined,
    });
  }
});

export default router;
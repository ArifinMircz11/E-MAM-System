import { Router } from 'express';
import { getAdminAuth, getAdminDb } from '../../src/lib/firebase-admin.js';

const router = Router();

/**
 * e-MAM System
 * CanonicalUser Authentication Routes
 *
 * Identity SSOT:
 *   Firebase Auth UID
 *        ↓
 *   CanonicalUser
 *        ↓
 *   role + referenceId
 *        ↓
 *   students / teachers
 *
 * IMPORTANT:
 * - Do NOT create legacy identity fields such as:
 *   studentId, teacherId, peran, idUnik as identity SSOT.
 * - referenceId is the canonical link to the master entity.
 * - role determines the entity collection.
 */

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

  profile: {
    displayName: string;
    email: string;
    photoURL: string;
  };
}

/**
 * Common Error Logger
 */
const logAuthError = (context: string, error: unknown) => {
  const normalizedError = error as {
    message?: string;
    code?: string;
    stack?: string;
  };

  console.error(`[API_AUTH][${context}] FAIL:`, {
    message: normalizedError?.message,
    code: normalizedError?.code,
    stack: normalizedError?.stack?.split('\n').slice(0, 3).join('\n'),
  });
};

/**
 * Extract requester UID.
 *
 * This is only provenance/audit information.
 * It is NOT used as the effective identity of the created user.
 */
const getRequesterUid = (req: {
  headers: Record<string, string | string[] | undefined>;
}) => {
  const value = req.headers['x-requester-uid'];

  if (Array.isArray(value)) {
    return value[0] || 'system';
  }

  return value || 'system';
};

/**
 * Normalize email.
 */
const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Normalize phone number.
 */
const normalizePhoneNumber = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

/**
 * Resolve tenant ID from master entity.
 *
 * tenantId is mandatory for CanonicalUser.
 *
 * We intentionally do NOT invent a fallback tenant.
 */
const resolveTenantId = (
  entityData: Record<string, unknown> | undefined,
): string | null => {
  if (!entityData) {
    return null;
  }

  const tenantId =
    entityData.tenantId ??
    entityData.scope ??
    entityData.madrasahId ??
    null;

  if (tenantId === null || tenantId === undefined) {
    return null;
  }

  const normalized = String(tenantId).trim();

  return normalized.length > 0 ? normalized : null;
};

/**
 * Resolve display name from master entity.
 */
const resolveDisplayName = (
  entityData: Record<string, unknown> | undefined,
): string => {
  if (!entityData) {
    return '';
  }

  const value =
    entityData.displayName ??
    entityData.namaLengkap ??
    entityData.name ??
    entityData.nama ??
    '';

  return String(value).trim();
};

/**
 * Resolve phone number from master entity.
 */
const resolvePhoneNumber = (
  entityData: Record<string, unknown> | undefined,
): string => {
  if (!entityData) {
    return '';
  }

  return normalizePhoneNumber(
    entityData.phoneNumber ??
      entityData.phone ??
      entityData.noHp ??
      entityData.telepon ??
      '',
  );
};

/**
 * Resolve photo URL from master entity.
 */
const resolvePhotoURL = (
  entityData: Record<string, unknown> | undefined,
): string => {
  if (!entityData) {
    return '';
  }

  return String(entityData.photoURL ?? entityData.photoUrl ?? '').trim();
};

/**
 * Build CanonicalUser.
 *
 * This is the ONLY identity representation written by these routes.
 */
const buildCanonicalUser = ({
  uid,
  tenantId,
  role,
  referenceId,
  displayName,
  email,
  phoneNumber,
  photoURL,
  actorUid,
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
  actorUid: string;
  existingUser?: Record<string, unknown>;
}): CanonicalUserWrite => {
  const now = Date.now();

  const createdAt =
    typeof existingUser?.createdAt === 'number'
      ? existingUser.createdAt
      : now;

  const existingVersion =
    typeof existingUser?.version === 'number'
      ? existingUser.version
      : 0;

  const nextVersion = existingVersion + 1;

  return {
    /**
     * Canonical identity
     *
     * id and uid intentionally refer to the Firebase Auth identity.
     */
    id: uid,
    uid,

    tenantId,
    accountType: 'madrasah',

    /**
     * Canonical RBAC
     */
    role,
    roles: [role],

    /**
     * Canonical master-entity relationship
     *
     * siswa → students/{referenceId}
     * guru  → teachers/{referenceId}
     */
    referenceId,

    displayName,
    email,
    phoneNumber,
    photoURL,

    status: 'aktif',
    accountStatus: 'aktif',

    createdAt,
    updatedAt: now,

    createdBy:
      typeof existingUser?.createdBy === 'string'
        ? existingUser.createdBy
        : actorUid,

    updatedBy: actorUid,

    deleted: false,
    isActive: true,
    isClaimed: true,
    isSso: false,

    /**
     * Keep existing approval state when present.
     */
    approvalStatus:
      existingUser?.approvalStatus === 'approved'
        ? 'approved'
        : existingUser?.approvalStatus === 'rejected'
          ? 'rejected'
          : 'pending',

    schemaVersion: 17,
    rbacVersion: 2,
    version: nextVersion,

    syncStatus: 'pending',

    permissions: Array.isArray(existingUser?.permissions)
      ? existingUser.permissions.filter(
          (permission): permission is string =>
            typeof permission === 'string',
        )
      : [],

    profile: {
      displayName,
      email,
      photoURL,
    },
  };
};

/**
 * POST /api/auth/claim
 *
 * Student account claiming flow:
 *
 * idUnik
 *   ↓
 * students/{idUnik}
 *   ↓
 * Firebase Auth
 *   ↓
 * CanonicalUser
 *   ↓
 * students.isClaimed
 */
router.post('/claim', async (req, res) => {
  const { idUnik, email, password, nisn } = req.body;

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    if (!idUnik || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'ID Unik, Email, and Password are required',
      });
    }

    const normalizedEmail = normalizeEmail(email);

    /**
     * 1. Verify student identity.
     */
    const studentRef = db.collection('students').doc(String(idUnik));
    const studentSnap = await studentRef.get();

    if (!studentSnap.exists) {
      return res.status(404).json({
        success: false,
        message: 'ID Unik tidak ditemukan di database siswa.',
      });
    }

    const studentData =
      (studentSnap.data() as Record<string, unknown> | undefined) ?? {};

    /**
     * 2. Validate NISN when both values exist.
     */
    if (
      nisn &&
      studentData.nisn &&
      String(studentData.nisn) !== String(nisn)
    ) {
      return res.status(401).json({
        success: false,
        message: 'NISN tidak cocok dengan data yang terdaftar.',
      });
    }

    /**
     * 3. Prevent duplicate claim.
     */
    if (studentData.isClaimed === true) {
      return res.status(400).json({
        success: false,
        message: 'Akun ini sudah diklaim sebelumnya.',
      });
    }

    /**
     * 4. Resolve tenant from master entity.
     *
     * No hardcoded tenant fallback.
     */
    const tenantId = resolveTenantId(studentData);

    if (!tenantId) {
      return res.status(422).json({
        success: false,
        message:
          'Tenant siswa tidak ditemukan. CanonicalUser membutuhkan tenantId.',
      });
    }

    /**
     * 5. Create Firebase Auth user.
     */
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
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar di sistem.',
        });
      }

      throw error;
    }

    const requesterUid = getRequesterUid(req);

    /**
     * 6. Build CanonicalUser.
     */
    const canonicalUser = buildCanonicalUser({
      uid: userRecord.uid,
      tenantId,
      role: 'siswa',
      referenceId: studentRef.id,
      displayName: resolveDisplayName(studentData),
      email: normalizedEmail,
      phoneNumber: resolvePhoneNumber(studentData),
      photoURL: resolvePhotoURL(studentData),
      actorUid: requesterUid,
    });

    /**
     * 7. Atomic Firestore update.
     */
    const batch = db.batch();

    /**
     * CanonicalUser SSOT
     *
     * Collection remains "users" for compatibility with the current
     * project, but the document MUST follow CanonicalUser contract.
     */
    const canonicalUserRef = db
      .collection('users')
      .doc(canonicalUser.id);

    batch.set(canonicalUserRef, canonicalUser, {
      merge: false,
    });

    /**
     * Update student master entity.
     *
     * referenceId remains the canonical relationship.
     */
    batch.update(studentRef, {
      isClaimed: true,
      authUid: userRecord.uid,
      linkedUserId: userRecord.uid,
      email: normalizedEmail,
      lastModified: Date.now(),
    });

    /**
     * Audit log.
     */
    const logRef = db.collection('login_logs').doc();

    batch.set(logRef, {
      userId: userRecord.uid,
      userEmail: normalizedEmail,
      tenantId,
      action: 'CLAIM_ACCOUNT',
      timestamp: Date.now(),
      details: `Student account claimed: ${canonicalUser.displayName}`,
      referenceId: studentRef.id,
      role: 'siswa',
    });

    await batch.commit();

    return res.json({
      success: true,
      message:
        'Akun berhasil diklaim. Silakan masuk menggunakan email dan password Anda.',
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

    const normalizedError = error as {
      message?: string;
    };

    return res.status(500).json({
      success: false,
      message: 'Gagal memproses klaim akun.',
      error:
        process.env.NODE_ENV === 'development'
          ? normalizedError.message
          : undefined,
    });
  }
});

/**
 * POST /api/auth/teacher-activate
 *
 * Teacher activation flow:
 *
 * teachers/{teacherId}
 *   ↓
 * Firebase Auth
 *   ↓
 * CanonicalUser
 *   ↓
 * referenceId = teacherId
 */
router.post('/teacher-activate', async (req, res) => {
  const { teacherId, email, role, password } = req.body;

  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    if (!teacherId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID and Email are required.',
      });
    }

    /**
     * Role is no longer allowed to arbitrarily define the identity.
     *
     * This endpoint is specifically for teacher activation.
     */
    if (role && String(role).toLowerCase() !== 'guru') {
      return res.status(400).json({
        success: false,
        message:
          'Role tidak valid. Teacher activation hanya menghasilkan role guru.',
      });
    }

    /**
     * Password must be explicitly supplied.
     *
     * NEVER use a hardcoded default production password.
     */
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password wajib diberikan untuk aktivasi akun guru.',
      });
    }

    const normalizedEmail = normalizeEmail(email);

    /**
     * 1. Verify teacher exists.
     */
    const teacherRef = db.collection('teachers').doc(String(teacherId));
    const teacherSnap = await teacherRef.get();

    if (!teacherSnap.exists) {
      return res.status(404).json({
        success: false,
        message: 'Data Guru tidak ditemukan.',
      });
    }

    const teacherData =
      (teacherSnap.data() as Record<string, unknown> | undefined) ?? {};

    /**
     * 2. Resolve tenant.
     */
    const tenantId = resolveTenantId(teacherData);

    if (!tenantId) {
      return res.status(422).json({
        success: false,
        message:
          'Tenant guru tidak ditemukan. CanonicalUser membutuhkan tenantId.',
      });
    }

    /**
     * 3. Handle Firebase Auth user.
     */
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

    /**
     * 4. Read existing CanonicalUser.
     *
     * This allows activation to preserve createdAt,
     * approval state, permissions, etc.
     */
    const canonicalUserRef = db
      .collection('users')
      .doc(userRecord.uid);

    const existingCanonicalSnap = await canonicalUserRef.get();

    const existingCanonicalUser = existingCanonicalSnap.exists
      ? (existingCanonicalSnap.data() as Record<string, unknown>)
      : undefined;

    const requesterUid = getRequesterUid(req);

    /**
     * 5. Build CanonicalUser.
     */
    const canonicalUser = buildCanonicalUser({
      uid: userRecord.uid,
      tenantId,
      role: 'guru',
      referenceId: teacherRef.id,
      displayName: resolveDisplayName(teacherData),
      email: normalizedEmail,
      phoneNumber: resolvePhoneNumber(teacherData),
      photoURL: resolvePhotoURL(teacherData),
      actorUid: requesterUid,
      existingUser: existingCanonicalUser,
    });

    /**
     * 6. Atomic Firestore update.
     */
    const batch = db.batch();

    /**
     * CanonicalUser.
     */
    batch.set(canonicalUserRef, canonicalUser, {
      merge: false,
    });

    /**
     * Update teacher master entity.
     */
    batch.update(teacherRef, {
      isClaimed: true,
      authUid: userRecord.uid,
      linkedUserId: userRecord.uid,
      email: normalizedEmail,
      accountStatus: 'aktif',
      lastActivated: Date.now(),
      updatedAt: Date.now(),
    });

    /**
     * Audit log.
     */
    const logRef = db.collection('login_logs').doc();

    batch.set(logRef, {
      userId: userRecord.uid,
      userEmail: normalizedEmail,
      tenantId,
      action: 'ADMIN_ACTIVATE_TEACHER',
      timestamp: Date.now(),
      details: `Teacher ${canonicalUser.displayName} activated.`,
      executedBy: requesterUid,
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

    const normalizedError = error as {
      message?: string;
    };

    return res.status(500).json({
      success: false,
      message: 'Gagal mengaktifkan akun guru.',
      error:
        process.env.NODE_ENV === 'development'
          ? normalizedError.message
          : undefined,
    });
  }
});

export default router;
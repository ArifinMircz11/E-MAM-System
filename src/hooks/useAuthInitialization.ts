import { useEffect, useState } from 'react';
import { onAuthStateChanged, attemptAutoLinkStudent, getMasterProfile } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import { UserRole, DEVELOPER_EMAILS } from '@/types';
import { normalizeUserDataRoles } from '@/utils/roleNormalizer';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { toast } from 'sonner';
import { FirebaseUserSyncService } from '@/services/sync/FirebaseUserSyncService';

/**
 * Canonical auth bootstrap:
 * Firebase Auth -> users/{uid} -> canonical tenant/reference -> SecurityContext.
 *
 * The authoritative user returned by FirebaseUserSyncService is consumed directly.
 * The bootstrap must not perform a second Dexie round-trip through watchUserDoc,
 * because that creates an unnecessary race during the most critical application
 * lifecycle transition.
 */
export const useAuthInitialization = () => {
  const [authLoading, setAuthLoading] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const setAccountStatus = useAuthStore((state) => state.setAccountStatus);
  const setUserData = useUserStore((state) => state.setUserData);
  const clearUserData = useUserStore((state) => state.clearUserData);
  const setProfile = useProfileStore((state) => state.setProfile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const setProfileLoading = useProfileStore((state) => state.setIsLoading);

  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    SecurityContextService.setLifecycleState('BOOTSTRAPPING');

    const finishLoading = () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      setAuthLoading(false);
    };

    const unsubAuth = onAuthStateChanged(async (firebaseUser) => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }

      if (!firebaseUser) {
        setUser(null);
        clearUserData();
        clearProfile();
        setAccountStatus(null);
        finishLoading();
        SecurityContextService.setLifecycleState('SIGNED_OUT');
        return;
      }

      setAuthLoading(true);
      SecurityContextService.setLifecycleState('AUTHENTICATED');
      safetyTimer = setTimeout(finishLoading, 5000);

      try {
        const authoritativeUser = await FirebaseUserSyncService.syncAuthUser(firebaseUser);

        if (!authoritativeUser) {
          throw new Error('Canonical user resolution returned no identity');
        }

        if (authoritativeUser.isGuest) {
          const guestProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || null,
            accountType: 'guest',
            role: UserRole.TAMU,
            roles: [UserRole.TAMU],
            tenantId: null,
            referenceId: null,
            studentsId: null,
            teachersId: null,
            status: 'pending',
            approvalStatus: 'pending',
            registrationRequired: true,
          };

          setUser(guestProfile as any);
          setUserData({
            uid: firebaseUser.uid,
            roles: [UserRole.TAMU],
            accountType: 'guest',
            role: UserRole.TAMU,
            assignment: {
              studentId: null,
              teacherId: null,
              classId: null,
              positionId: 'guest',
            },
            tenantId: null,
            status: 'pending',
            approvalStatus: 'pending',
            version: 1,
            schemaVersion: 2,
          } as any);
          setProfile(guestProfile as any);
          setAccountStatus('pending' as any);

          // An authenticated account without a canonical user is a valid
          // authenticated-but-pending state, not an application error.
          finishLoading();
          return;
        }

        SecurityContextService.setLifecycleState('IDENTITY_RESOLVED');

        const normalized = normalizeUserDataRoles(
          authoritativeUser,
          firebaseUser.email || '',
        );
        const roles = normalized.roles;
        const accountType = normalized.accountType;
        const role = roles[0];
        const isDev =
          DEVELOPER_EMAILS.includes(firebaseUser.email || '') ||
          roles.includes(UserRole.DEVELOPER);

        const referenceId =
          typeof authoritativeUser.referenceId === 'string' &&
          authoritativeUser.referenceId.trim()
            ? authoritativeUser.referenceId.trim()
            : null;

        if (!referenceId) {
          throw new Error('Canonical user has no explicit referenceId');
        }

        // Developer is a system identity, not a fallback tenant.
        const tenantId = authoritativeUser.tenantId || (isDev ? 'system' : null);
        if (!tenantId) {
          throw new Error('Canonical user has no explicit tenantId');
        }
        if (['global', 'default', 'unknown'].includes(tenantId)) {
          throw new Error(`Invalid canonical tenantId: ${tenantId}`);
        }

        const studentType = ['student', 'siswa'].includes(
          String(accountType).toLowerCase(),
        );
        const teacherType = ['teacher', 'guru', 'pendidik'].includes(
          String(accountType).toLowerCase(),
        );

        if (role === UserRole.SISWA && !authoritativeUser.studentsId) {
          try {
            const linkRes = await attemptAutoLinkStudent(
              firebaseUser.uid,
              firebaseUser.email || '',
              tenantId,
            );
            if (linkRes) toast.success('Akun berhasil dihubungkan secara otomatis.');
          } catch (linkErr) {
            console.warn('[AuthInit] Auto-link student failed:', linkErr);
          }
        }

        const studentId = studentType
          ? referenceId
          : authoritativeUser.studentsId || null;
        const teacherId = teacherType
          ? referenceId
          : authoritativeUser.teachersId || null;

        const status = authoritativeUser.status || 'active';
        const userData = {
          uid: firebaseUser.uid,
          roles,
          accountType,
          role,
          assignment: {
            studentId,
            teacherId,
            classId: authoritativeUser.classId || null,
            positionId: authoritativeUser.positionId || role,
          },
          tenantId,
          status,
          approvalStatus: authoritativeUser.approvalStatus || 'approved',
          version: authoritativeUser.version || 1,
          schemaVersion: authoritativeUser.schemaVersion || 1,
        };

        const profilePayload = {
          uid: firebaseUser.uid,
          email: authoritativeUser.email || firebaseUser.email || '',
          displayName:
            authoritativeUser.displayName || firebaseUser.displayName || '',
          photoURL:
            authoritativeUser.photoURL || firebaseUser.photoURL || null,
          role,
          roles,
          studentsId: studentId,
          teachersId: teacherId,
          tenantId,
          status,
          referenceId,
        };

        setUser(profilePayload as any);
        setUserData(userData as any);
        setAccountStatus(status as any);

        // Only student/teacher accounts have a domain master profile. Organization
        // and developer identities are complete at the canonical user boundary and
        // must not trigger an unrelated teacher/student repository read here.
        setProfileLoading(true);
        try {
          if (studentType || teacherType) {
            const masterData = await getMasterProfile(
              firebaseUser.uid,
              accountType,
              referenceId,
            );
            setProfile(masterData || profilePayload);
          } else {
            setProfile(profilePayload as any);
          }
        } finally {
          setProfileLoading(false);
        }

        SecurityContextService.setLifecycleState('READY');
        finishLoading();
      } catch (error) {
        console.error('[AuthInit] Initialization failed:', error);
        setAccountStatus('pending' as any);
        SecurityContextService.setLifecycleState(
          'ERROR',
          error instanceof Error ? error : String(error),
        );
        finishLoading();
      }
    });

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      unsubAuth();
    };
  }, [
    setUser,
    setAccountStatus,
    setUserData,
    clearUserData,
    setProfile,
    clearProfile,
    setProfileLoading,
  ]);

  return { authLoading };
};

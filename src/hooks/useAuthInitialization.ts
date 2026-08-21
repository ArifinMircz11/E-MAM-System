import { useState, useEffect } from 'react';
import { onAuthStateChanged, watchUserDoc, attemptAutoLinkStudent, getMasterProfile } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import { UserRole, DEVELOPER_EMAILS } from '@/types';
import { normalizeUserDataRoles } from '@/utils/roleNormalizer';
import { localDb } from '@/database/dexie';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { toast } from 'sonner';
import { FirebaseUserSyncService } from '@/services/sync/FirebaseUserSyncService';

/** Canonical auth bootstrap: Firebase Auth -> users/{uid} -> explicit referenceId -> SecurityContext. */
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
    let unsubUserDoc: (() => void) | null = null;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;
    SecurityContextService.setLifecycleState('BOOTSTRAPPING');

    const unsubAuth = onAuthStateChanged(async (firebaseUser) => {
      if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
      if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
      if (!firebaseUser) {
        setUser(null); clearUserData(); clearProfile(); setAccountStatus(null); setAuthLoading(false);
        SecurityContextService.setLifecycleState('SIGNED_OUT');
        return;
      }
      setAuthLoading(true);
      SecurityContextService.setLifecycleState('AUTHENTICATED');
      safetyTimer = setTimeout(() => setAuthLoading(false), 5000);

      try {
        const authoritativeUser = await FirebaseUserSyncService.syncAuthUser(firebaseUser);
        if (authoritativeUser?.isGuest) {
          const guestProfile = {
            uid: firebaseUser.uid, email: firebaseUser.email || '', displayName: firebaseUser.displayName || '', photoURL: firebaseUser.photoURL || null,
            accountType: 'guest', role: UserRole.TAMU, roles: [UserRole.TAMU], tenantId: null, referenceId: null, studentsId: null, teachersId: null,
            status: 'pending', approvalStatus: 'pending', registrationRequired: true,
          };
          setUser(guestProfile as any);
          setUserData({ uid: firebaseUser.uid, roles: [UserRole.TAMU], accountType: 'guest', role: UserRole.TAMU, assignment: { studentId: null, teacherId: null, classId: null, positionId: 'guest' }, tenantId: null, status: 'pending', approvalStatus: 'pending', version: 1, schemaVersion: 2 } as any);
          setProfile(guestProfile as any); setAccountStatus('pending' as any);
          SecurityContextService.setLifecycleState('ERROR', 'Authenticated account is not registered or referenceId is unresolved');
          return;
        }
        if (!authoritativeUser) throw new Error('Canonical user resolution returned no identity');

        unsubUserDoc = watchUserDoc(firebaseUser.uid, async (data) => {
          try {
            if (!data) throw new Error('Canonical users document disappeared after authoritative resolution');
            SecurityContextService.setLifecycleState('IDENTITY_RESOLVED');
            const normalized = normalizeUserDataRoles(data, firebaseUser.email || '');
            const roles = normalized.roles;
            const accountType = normalized.accountType;
            const role = roles[0];
            const isDev = DEVELOPER_EMAILS.includes(firebaseUser.email || '') || roles.includes(UserRole.DEVELOPER);
            const referenceId = typeof data.referenceId === 'string' && data.referenceId.trim() ? data.referenceId.trim() : null;
            if (!referenceId) throw new Error('Canonical user has no explicit referenceId');

            // Developer is a system identity, not a fallback global tenant.
            const tenantId = data.tenantId || (isDev ? 'system' : null);
            if (!tenantId) throw new Error('Canonical user has no explicit tenantId');
            if (tenantId === 'global' || tenantId === 'default' || tenantId === 'unknown') throw new Error(`Invalid canonical tenantId: ${tenantId}`);

            if (role === UserRole.SISWA && !data.studentsId) {
              try {
                const linkRes = await attemptAutoLinkStudent(firebaseUser.uid, firebaseUser.email || '', tenantId);
                if (linkRes) toast.success('Akun berhasil dihubungkan secara otomatis.');
              } catch (linkErr) { console.warn('[AuthInit] Auto-link student failed:', linkErr); }
            }

            const studentType = ['student', 'siswa'].includes(String(accountType).toLowerCase());
            const teacherType = ['teacher', 'guru', 'pendidik'].includes(String(accountType).toLowerCase());
            const studentId = studentType ? referenceId : (data.studentsId || null);
            const teacherId = teacherType ? referenceId : (data.teachersId || null);
            const userData = { uid: firebaseUser.uid, roles, accountType, role, assignment: { studentId, teacherId, classId: data.classId || null, positionId: data.positionId || role }, tenantId, status: data.status || 'active', approvalStatus: data.approvalStatus || 'approved', version: data.version || 1, schemaVersion: data.schemaVersion || 1 };
            const profilePayload = { uid: firebaseUser.uid, email: data.email || firebaseUser.email || '', displayName: data.displayName || firebaseUser.displayName || '', photoURL: data.photoURL || firebaseUser.photoURL || null, role, roles, studentsId: studentId, teachersId: teacherId, tenantId, status: userData.status, referenceId };

            setUser(profilePayload as any); setUserData(userData as any); setAccountStatus(userData.status as any);
            await localDb.users.put({ ...data, id: firebaseUser.uid, uid: firebaseUser.uid, referenceId, updatedAt: Date.now() });
            setProfileLoading(true);
            try { const masterData = await getMasterProfile(firebaseUser.uid, accountType, referenceId); setProfile(masterData || profilePayload); }
            finally { setProfileLoading(false); }
            SecurityContextService.setLifecycleState('READY');
          } catch (cbErr) {
            console.error('[AuthInit] Callback processing error:', cbErr); setAccountStatus('pending' as any);
            SecurityContextService.setLifecycleState('ERROR', cbErr instanceof Error ? cbErr : String(cbErr));
          } finally {
            if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; } setAuthLoading(false);
          }
        }, (err) => {
          console.error('[AuthInit] watchUserDoc error:', err); if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
          setAuthLoading(false); SecurityContextService.setLifecycleState('ERROR', err);
        });
      } catch (error) {
        console.error('[AuthInit] Initialization failed:', error); if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
        setAuthLoading(false); SecurityContextService.setLifecycleState('ERROR', error instanceof Error ? error : String(error));
      }
    });

    return () => { if (safetyTimer) clearTimeout(safetyTimer); unsubAuth(); if (unsubUserDoc) unsubUserDoc(); };
  }, [setUser, setAccountStatus, setUserData, clearUserData, setProfile, clearProfile, setProfileLoading]);

  return { authLoading };
};

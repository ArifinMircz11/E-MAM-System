import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  watchUserDoc, 
  ensureUserDoc, 
  attemptAutoLinkStudent, 
  getMasterProfile 
} from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useProfileStore } from '@/stores/profileStore';
import { UserRole, DEVELOPER_EMAILS } from '@/types';
import { normalizeUserDataRoles } from '@/utils/roleNormalizer';
import { localDb } from '@/database/dexie';
import { SecurityContextService } from '@/core/security/SecurityContextService';
import { toast } from 'sonner';

/**
 * useAuthInitialization - Single Source of Truth Auth Bootstrap Hook
 *
 * Responsibility:
 * 1. Firebase Auth listener
 * 2. User document subscription (Firestore)
 * 3. Identity mapping and Store updates (Zustand)
 * 4. Master Profile loading (Student/Teacher)
 * 5. Automatic relationship linking
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
    let unsubUserDoc: (() => void) | null = null;
    let safetyTimer: NodeJS.Timeout | null = null;

    SecurityContextService.setLifecycleState('BOOTSTRAPPING');

    const unsubAuth = onAuthStateChanged(async (firebaseUser) => {
      // Cleanup previous user doc subscription & safety timer if any
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }

      if (firebaseUser) {
        setAuthLoading(true);
        SecurityContextService.setLifecycleState('AUTHENTICATED');

        // Safety fallback: Guarantee authLoading is set to false within 3.5 seconds
        safetyTimer = setTimeout(() => {
          console.warn('[AuthInit] Safety timer expired. Resolving authLoading state.');
          setAuthLoading(false);
        }, 3500);

        try {
          // PHASE 1: Ensure User Document Exists in Firestore (with 2s max wait)
          await Promise.race([
            ensureUserDoc(
              firebaseUser.uid,
              firebaseUser.email || '',
              firebaseUser.displayName || 'Pengguna',
            ),
            new Promise((res) => setTimeout(res, 2000)),
          ]);
        } catch (ensureErr) {
          console.warn('[AuthInit] ensureUserDoc timed out or failed:', ensureErr);
        }

        try {
          // PHASE 2: Subscribe to Realtime User Document Updates
          unsubUserDoc = watchUserDoc(
            firebaseUser.uid,
            async (data) => {
              try {
                if (data) {
                  SecurityContextService.setLifecycleState('IDENTITY_RESOLVED');

                  // PHASE 3: Identity & Role Normalization
                  const normalized = normalizeUserDataRoles(data, firebaseUser.email || '');
                  const roles = normalized.roles;
                  const accountType = normalized.accountType;
                  const role = roles[0];
                  const isDev = (firebaseUser.email && DEVELOPER_EMAILS.includes(firebaseUser.email)) || roles.includes(UserRole.DEVELOPER);
                  const tenantId = data.tenantId || (isDev ? 'global' : (data.madrasahId || ''));

                  // AUTO-LINK ENGINE (V7.7 Phase 3)
                  if (role === UserRole.SISWA && (!data.assignment?.studentId && !data.studentsId)) {
                    try {
                      const linkRes = await attemptAutoLinkStudent(
                        firebaseUser.uid,
                        firebaseUser.email || '',
                        tenantId,
                      );
                      if (linkRes) {
                        toast.success('Akun berhasil dihubungkan secara otomatis.');
                      }
                    } catch (linkErr) {
                      console.warn('[AuthInit] Auto-link student failed:', linkErr);
                    }
                  }

                  const userData = {
                    uid: firebaseUser.uid,
                    roles: roles,
                    accountType: accountType,
                    role: role,
                    assignment: data.assignment || {
                      studentId: data.studentsId || data.studentId || null,
                      teacherId: data.teachersId || data.teacherId || null,
                      classId: data.classId || null,
                      positionId: data.positionId || (accountType === 'madrasah' ? (role === UserRole.SISWA ? 'student' : 'teacher') : role),
                    },
                    tenantId: tenantId,
                    status: data.status || 'active',
                    approvalStatus: data.approvalStatus || 'approved',
                    version: data.version || 1,
                    schemaVersion: data.schemaVersion || 1,
                  };

                  // Security Check: Need ID Verification if not linked and not Admin/Dev
                  if (
                    !isDev &&
                    !roles.includes(UserRole.ADMIN) &&
                    !roles.includes(UserRole.DEVELOPER) &&
                    !userData.assignment.studentId &&
                    !userData.assignment.teacherId
                  ) {
                    if (userData.status === 'active' || userData.status === 'Active') {
                      userData.status = 'needs_id_verification';
                    }
                  }

                  // Atomic Store Updates
                  const profilePayload = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: data.displayName || firebaseUser.displayName || 'Pengguna',
                    photoURL: firebaseUser.photoURL || null,
                    role: role,
                    roles: roles,
                    studentsId: userData.assignment.studentId,
                    teachersId: userData.assignment.teacherId,
                    idUnik: data.idUnik || userData.assignment.studentId || firebaseUser.uid,
                    tenantId: tenantId,
                    status: userData.status,
                    referenceId: userData.assignment.studentId || userData.assignment.teacherId || null,
                  };

                  setUser(profilePayload as any);
                  setUserData(userData as any);
                  setAccountStatus(userData.status as any);

                  // Cache in Dexie for Offline Mode Support
                  try {
                    const existing = await localDb.users.get(firebaseUser.uid);
                    await localDb.users.put({
                      ...data,
                      ...userData,
                      id: firebaseUser.uid,
                      updatedAt: Date.now(),
                      passwordHash: existing?.passwordHash || null,
                    });
                  } catch (dexieErr) {
                    console.warn('[AuthInit] Failed to update localDb user:', dexieErr);
                  }

                  // PHASE 4: Master Profile Enrichment (Student/Teacher Data)
                  setProfileLoading(true);
                  const referenceId = userData.assignment.studentId || userData.assignment.teacherId;
                  
                  if (referenceId) {
                    try {
                      const masterData = await getMasterProfile(
                        firebaseUser.uid,
                        userData.accountType,
                        referenceId,
                      );
                      if (masterData) {
                        setProfile(masterData);
                      } else {
                        setProfile(profilePayload);
                      }
                    } catch (e) {
                      setProfile(profilePayload);
                    } finally {
                      setProfileLoading(false);
                    }
                  } else {
                    setProfile(profilePayload);
                    setProfileLoading(false);
                  }

                  // Validate and Transition to READY
                  const secCtx = SecurityContextService.getNullableContext();
                  if (secCtx && secCtx.uid && (secCtx.tenantId || isDev)) {
                    SecurityContextService.setLifecycleState('READY');
                  } else {
                    SecurityContextService.setLifecycleState('ERROR', 'Incomplete security context after identity resolution');
                  }
                } else {
                  // Handle case where user exists in Auth but Doc is missing or local read delayed
                  const isDev = firebaseUser.email && DEVELOPER_EMAILS.includes(firebaseUser.email);
                  
                  if (isDev) {
                    const devProfile = {
                      uid: firebaseUser.uid,
                      id: firebaseUser.uid,
                      email: firebaseUser.email || '',
                      displayName: firebaseUser.displayName || 'Developer',
                      namaTampilan: firebaseUser.displayName || 'Developer',
                      photoURL: firebaseUser.photoURL || null,
                      role: UserRole.DEVELOPER,
                      roles: [UserRole.DEVELOPER],
                      studentsId: null,
                      teachersId: null,
                      referenceId: null,
                      tenantId: 'global',
                      status: 'active',
                      isActive: true,
                      version: 1,
                      rbacVersion: 1,
                      securityVersion: 1,
                      schemaVersion: 2,
                      accountType: 'developer',
                      syncStatus: 'synced',
                    };

                    setUser(devProfile as any);
                    setUserData({
                      uid: firebaseUser.uid,
                      roles: [UserRole.DEVELOPER],
                      accountType: 'developer',
                      role: UserRole.DEVELOPER,
                      assignment: { studentId: null, teacherId: null, classId: null, positionId: 'developer' },
                      tenantId: 'global',
                      status: 'active',
                      approvalStatus: 'approved',
                      version: 1,
                      schemaVersion: 2,
                    } as any);
                    setAccountStatus('active' as any);
                    setProfile(devProfile as any);
                    SecurityContextService.setLifecycleState('READY');
                  } else {
                    // FAIL CLOSED: Jangan menyulap akun biasa menjadi siswa tanpa dokumen otoritatif
                    console.warn(`[AuthInit] Profil pengguna ${firebaseUser.uid} belum ditemukan di database. Menunggu sinkronisasi profil.`);
                    setAccountStatus('needs_profile_sync' as any);
                    SecurityContextService.setLifecycleState('ERROR', 'Profil pengguna belum ditemukan di database');
                  }
                }

              } catch (cbErr) {
                console.error('[AuthInit] Callback processing error:', cbErr);
                SecurityContextService.setLifecycleState('ERROR', cbErr instanceof Error ? cbErr : String(cbErr));
              } finally {
                if (safetyTimer) {
                  clearTimeout(safetyTimer);
                  safetyTimer = null;
                }
                setAuthLoading(false);
              }
            },
            (err) => {
              console.error('[AuthInit] watchUserDoc error:', err);
              if (safetyTimer) {
                clearTimeout(safetyTimer);
                safetyTimer = null;
              }
              setAuthLoading(false);
              SecurityContextService.setLifecycleState('ERROR', err);
            }
          );
        } catch (error) {
          console.error('[AuthInit] Initialization failed:', error);
          if (safetyTimer) {
            clearTimeout(safetyTimer);
            safetyTimer = null;
          }
          setAuthLoading(false);
          SecurityContextService.setLifecycleState('ERROR', error instanceof Error ? error : String(error));
        }
      } else {
        // LOGOUT / NO USER
        if (navigator.onLine) {
          setUser(null);
          clearUserData();
          clearProfile();
          setAccountStatus(null);
        }
        if (safetyTimer) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
        }
        setAuthLoading(false);
        SecurityContextService.setLifecycleState('SIGNED_OUT');
      }
    });

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      unsubAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, [setUser, setAccountStatus, setUserData, clearUserData, setProfile, clearProfile, setProfileLoading]);

  return { authLoading };
};

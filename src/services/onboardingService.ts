import { useUserStore } from '@/stores/userStore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  collection,
  doc,
  runTransaction,
  query,
  where,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from '@/services/dbGateway';
import { getDocsSafe } from '@/services/sync/firestoreHelpers';
import { logAudit } from './auditLogService';
import { realtimeHub } from './realtime/realtimeHub';

export interface OnboardingRequest {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'siswa' | 'guru' | 'wali_kelas' | 'kepala' | 'staf';
  tenantId: string;
  status: 'pending' | 'approved' | 'rejected';
  gateType?: 'gate1' | 'gate2';
  formData: Record<string, any>;
  adminNote?: string;
  createdAt: any;
  updatedAt: any;
}

const COLL_NAME = 'approval_requests';

/**
 * Submit Gate 1 onboarding request with unique ID and gateType 'gate1'
 */
export async function submitProfileCompletionRequest(request: any): Promise<void> {
  const timestamp = Date.now();
  const requestId = `${request.userId}_${timestamp}`;
  const path = `profile_update_requests/${requestId}`;

  try {
    // Secara otomatis mencari dan menghapus seluruh pengajuan duplikat aktif (status pending) untuk UID/userId ini
    const duplicateQuery = query(
      collection(db, 'profile_update_requests'),
      where('userId', '==', request.userId),
      where('status', '==', 'pending'),
    );
    const duplicateSnap = await getDocsSafe(duplicateQuery);
    if (duplicateSnap && duplicateSnap.length > 0) {
      const batch = writeBatch(db);
      duplicateSnap.forEach((docObj: any) => {
        batch.delete(doc(db, 'profile_update_requests', docObj.id));
      });
      await batch.commit();
    }

    const ref = doc(db, 'profile_update_requests', requestId);
    const payload = {
      ...request,
      id: requestId,
      status: 'pending',
      gateType: 'gate1',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await runTransaction(db, async (transaction) => {
      transaction.set(ref, payload, { merge: true });

      // Update user status
      const userRef = doc(db, 'users', request.userId);
      transaction.update(userRef, {
        status: 'pending_profile_approval',
        accountStatus: 'pending_profile_approval',
        updatedAt: serverTimestamp(),
      });
    });

    await logAudit({
      userId: request.userId,
      userEmail: request.email,
      userName: request.displayName,
      action: 'SUBMIT_PROFILE_COMPLETION',
      category: 'AUTH',
      details: `User submitted profile completion request for role: ${request.role}`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Submit Gate 2 data linkage request to the same approval requests collection
 */
export async function submitDataLinkageRequest(
  userId: string,
  targetId: string,
  role: 'siswa' | 'guru',
  details: any,
): Promise<void> {
  const timestamp = Date.now();
  const requestId = `${userId}_gate2_${timestamp}`;
  const path = `${COLL_NAME}/${requestId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const requestRef = doc(db, COLL_NAME, requestId);

    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required for linkage request');

    const payload = {
      id: requestId,
      userId,
      gateType: 'gate2',
      status: 'pending',
      email: details.email || '',
      role,
      displayName: details.displayName || '',
      tenantId: tenantId,
      formData: {
        targetId,
        verifiedDataName: details.verifiedDataName || null,
        existsInMaster: details.existsInMaster || false,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await runTransaction(db, async (transaction) => {
      // 1. Set user status to pending_data_approval
      transaction.update(userRef, {
        status: 'pending_data_approval',
        accountStatus: 'pending_data_approval',
      });
      // 2. Write the Gate 2 request
      transaction.set(requestRef, payload);
    });

    await logAudit({
      userId,
      userEmail: details.email,
      userName: details.displayName,
      action: 'SUBMIT_DATA_LINKAGE_REQUEST',
      category: 'AUTH',
      details: `User submitted Gate 2 data linkage request for ID: ${targetId} (${role})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Get onboarding request by userId (finding the latest request)
 */
export async function getOnboardingRequestByUserId(
  userId: string,
): Promise<OnboardingRequest | null> {
  try {
    const tenantId = useUserStore.getState().tenantId;

    const q = query(
      collection(db, COLL_NAME),
      where('tenantId', '==', tenantId),
      where('userId', '==', userId),
    );
    const docs = await getDocsSafe<OnboardingRequest>(q);
    if (docs.length === 0) return null;

    // Sort descending by createdAt to find the latest
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    })[0];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${COLL_NAME}_query_${userId}`);
    return null;
  }
}

/**
 * Get all pending onboarding requests (Admin)
 */
export async function getPendingOnboardingRequests(): Promise<OnboardingRequest[]> {
  try {
    const tenantId = useUserStore.getState().tenantId;

    const q = query(
      collection(db, 'profile_update_requests'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'pending'),
    );
    const rawDocs = await getDocsSafe<OnboardingRequest>(q);
    const docs = rawDocs.filter(
      (d) => (d as any).gateType === 'gate1' || (d.formData && !(d as any).oldData),
    );

    // Tidak ada cache lokal untuk saat ini
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('[OnboardingService] Gagal memuat pengajuan.');
    return [];
  }
}

/**
 * Subscribe to all pending onboarding requests in real-time (Admin)
 */
export function subscribePendingOnboardingRequests(
  tenantId: string,
  onUpdate: (requests: OnboardingRequest[]) => void,
  onError?: (err: any) => void,
): () => void {
  if (!db || !tenantId) {
    onUpdate([]);
    return () => {};
  }

  let gate1Docs: OnboardingRequest[] = [];
  let gate2Docs: OnboardingRequest[] = [];

  const emitCombined = () => {
    const combined = [...gate1Docs, ...gate2Docs];
    const sorted = combined.sort((a, b) => {
      const timeA =
        a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
      const timeB =
        b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
      return timeB - timeA;
    });

    // Tidak ada cache lokal untuk saat ini
    onUpdate(sorted);
  };

  // 1. Subscribe to Gate 1 onboarding requests on profile_update_requests
  const q1 = query(
    collection(db, 'profile_update_requests'),
    where('tenantId', '==', tenantId),
    where('status', '==', 'pending'),
  );

  const unsub1 = onSnapshot(
    q1,
    (snapshot) => {
      gate1Docs = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as OnboardingRequest)
        .filter((d) => (d as any).gateType === 'gate1' || (d.formData && !(d as any).oldData));
      emitCombined();
    },
    (err) => {
      console.error('[onboardingService] subscribePendingOnboardingRequests Gate 1 error:', err);
      if (onError) onError(err);
    },
  );

  // 2. Subscribe to Gate 2 data linkage requests on approval_requests
  const q2 = query(
    collection(db, COLL_NAME),
    where('tenantId', '==', tenantId),
    where('status', '==', 'pending'),
  );

  const unsub2 = onSnapshot(
    q2,
    (snapshot) => {
      gate2Docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as OnboardingRequest);
      emitCombined();
    },
    (err) => {
      console.error('[onboardingService] subscribePendingOnboardingRequests Gate 2 error:', err);
      if (onError) onError(err);
    },
  );

  const finalUnsub = () => {
    unsub1();
    unsub2();
  };

  realtimeHub.subscribe('admin-onboarding-requests', finalUnsub);
  return finalUnsub;
}

/**
 * Get all pending metadata/data linkage requests of Gate 2 (Admin)
 */
export async function getPendingDataLinkageRequests(): Promise<OnboardingRequest[]> {
  try {
    const tenantId = useUserStore.getState().tenantId;

    const q = query(
      collection(db, COLL_NAME),
      where('tenantId', '==', tenantId),
      where('status', '==', 'pending'),
      where('gateType', '==', 'gate2'),
    );
    const docs = await getDocsSafe<OnboardingRequest>(q);

    // Tidak ada cache lokal untuk saat ini
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('[OnboardingService] Gagal memuat data linkage.');
    return [];
  }
}

/**
 * Get all onboarding requests history (Admin)
 */
export async function getOnboardingRequestsHistory(): Promise<OnboardingRequest[]> {
  try {
    const tenantId = useUserStore.getState().tenantId;

    const q = query(collection(db, COLL_NAME), where('tenantId', '==', tenantId));
    const docs = await getDocsSafe<OnboardingRequest>(q);
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLL_NAME);
    return [];
  }
}

/**
 * Resolve onboarding/linkage request with Zero-Trust atomic multi-document transaction (Supports Gate 1 & Gate 2)
 */
export async function resolveOnboardingRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  adminNote?: string,
  approvedByEmail?: string,
  approvedByUid?: string,
  fallbackRequest?: OnboardingRequest,
): Promise<void> {
  const path = `profile_update_requests/${requestId}`;
  try {
    let targetUserId = '';
    let targetRole: any = 'siswa';

    await runTransaction(db, async (transaction) => {
      const collName = requestId.includes('_gate2_')
        ? 'approval_requests'
        : 'profile_update_requests';
      const requestRef = doc(db, collName, requestId);
      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists()) {
        throw new Error('Profile update request tidak ditemukan.');
      }

      const requestData = requestSnap.data() as OnboardingRequest;
      if (requestData.status !== 'pending') {
        throw new Error('Profile update request sudah diproses sebelumnya.');
      }

      targetUserId = requestData.userId;
      targetRole = requestData.role || 'tamu';

      // 1. Update the request document status
      transaction.update(requestRef, {
        status,
        adminNote: adminNote || '',
        updatedAt: serverTimestamp(),
      });

      const userRef = doc(db, 'users', targetUserId);

      if (status === 'approved') {
        const { role, userId, email, displayName, tenantId, formData } = requestData;
        const targetId = String(
          formData?.targetId || formData?.idUnik || formData?.nisn || formData?.nip || userId,
        );

        // 2. Create Master Document in students or teachers
        const collectionName = role === 'siswa' ? 'students' : 'teachers';
        const masterRef = doc(db, collectionName, targetId);

        let masterPayload: any = {};
        if (requestData.gateType === 'gate2') {
          // Gate 2 is linkage of existing student/teacher: only link systems and update timestamp
          masterPayload = {
            sistemJangkar: {
              userId: userId,
            },
            updatedAt: serverTimestamp(),
          };
        } else {
          // Gate 1: Create master profile document
          masterPayload = {
            ...formData, // include all form data submitted by the user
            idUnik: targetId,
            tenantId: tenantId,
            npsn: formData?.npsn || tenantId,
            statusAktif: true,
            sistemJangkar: {
              userId: userId,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          // If student, ensure mandatory fields for verification logic are present in object root
          if (role === 'siswa') {
            masterPayload.status = 'Aktif'; // Administrative internal status
          }
        }

        transaction.set(masterRef, masterPayload, { merge: true });

        // 3. Update User Document
        const userUpdatePayload: any = {
          status: 'active',
          accountStatus: 'active',
          referenceId: targetId,
          idUnik: targetId,
          isClaimed: true,
          updatedAt: serverTimestamp(),
        };

        // Dynamic field based on role (backward compatibility)
        if (role === 'siswa') {
          userUpdatePayload.studentsId = targetId;
          userUpdatePayload.studentId = targetId;
        } else if (role === 'guru' || role === 'wali_kelas') {
          userUpdatePayload.teachersId = targetId;
          userUpdatePayload.teacherId = targetId;
        }

        transaction.update(userRef, userUpdatePayload);
      } else {
        // If rejected
        transaction.update(userRef, {
          status: 'rejected',
          accountStatus: 'rejected',
          adminNote: adminNote || 'Pengajuan profil ditolak oleh admin',
          updatedAt: serverTimestamp(),
        });
      }
    });

    // 2. Send Automated Notification (Post-Transaction via EventBus)
    const { eventBus } = await import('@/events/eventBus');
    const details =
      status === 'approved'
        ? `Request details: id: ${requestId} has been approved by admin.`
        : `Request details: id: ${requestId} has been rejected by admin. Note: ${adminNote || '-'}`;

    if (status === 'approved') {
      eventBus.publish('PROFILE_UPDATE_APPROVED', {
        id: `evt_prof_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0.0',
        timestamp: Date.now(),
        data: {
          reqId: requestId,
          details,
        },
      });
    } else {
      eventBus.publish('PROFILE_UPDATE_REJECTED', {
        id: `evt_prof_rej_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0.0',
        timestamp: Date.now(),
        data: {
          reqId: requestId,
          details,
        },
      });
    }

    if (targetUserId) {
      const title = status === 'approved' ? '🎉 Profil Disetujui' : '⚠️ Pengajuan Profil Ditolak';
      const message =
        status === 'approved'
          ? 'Selamat! Profil Anda telah disetujui dan data master Anda telah berhasil dibuat di dalam sistem madrasah.'
          : `Maaf, pengajuan profil Anda ditolak oleh admin. Alasan: ${adminNote || 'Data tidak sesuai atau kurang lengkap.'}`;

      // Publish event so notifications can handle it
      eventBus.publish('USER_UPDATED', {
        id: `evt_usr_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0.0',
        timestamp: Date.now(),
        data: {
          uid: targetUserId,
          details: `${title}: ${message}`,
          category: 'AUTH',
        },
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

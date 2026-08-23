import { liveQuery } from 'dexie';
import { DatabaseResolver, type EMamDatabase } from '@/database/dexie';
import { syncRepository } from './SyncRepository';
import { getSecurityContext } from '@/core/security/contextHelper';
import { ArchitectureBoundaryEnforcer } from '@/core/boundary/ArchitectureBoundaryEnforcer';

export type OnboardingStatus = 'pending' | 'approved' | 'rejected';
export type OnboardingRole = 'siswa' | 'guru' | 'wali_kelas' | 'kepala' | 'staf';

export interface OnboardingRequest {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: OnboardingRole;
  tenantId: string;
  status: OnboardingStatus;
  gateType?: 'gate1' | 'gate2';
  formData: Record<string, any>;
  adminNote?: string;
  createdAt: any;
  updatedAt: any;
}

const now = () => Date.now();

function assertTenant(tenantId: string) {
  const context = getSecurityContext(false);
  if (!context?.uid || !context.tenantId) throw new Error('ONBOARDING_SECURITY_CONTEXT_INVALID');
  ArchitectureBoundaryEnforcer.enforceTenantAccess(context.tenantId, tenantId, 'onboarding', context.isDeveloper);
  return context;
}

export class OnboardingRepository {
  private get db(): EMamDatabase { return DatabaseResolver.getDatabase(); }

  async getLatestByUserId(userId: string, tenantId: string): Promise<OnboardingRequest | null> {
    assertTenant(tenantId);
    const rows = await this.db.approval_requests.where('tenantId').equals(tenantId).filter(r => r.userId === userId).toArray();
    if (!rows.length) return null;
    return rows.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0))[0] as OnboardingRequest;
  }

  async listPending(tenantId: string, gateType?: 'gate1' | 'gate2'): Promise<OnboardingRequest[]> {
    assertTenant(tenantId);
    const tables = gateType === 'gate1' ? [this.db.profile_update_requests] : gateType === 'gate2' ? [this.db.approval_requests] : [this.db.profile_update_requests, this.db.approval_requests];
    const rows = (await Promise.all(tables.map(t => t.where('tenantId').equals(tenantId).filter(r => r.status === 'pending').toArray()))).flat();
    return rows.filter(r => !gateType || r.gateType === gateType || (gateType === 'gate1' && r.formData && !r.oldData)).sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)) as OnboardingRequest[];
  }

  async listHistory(tenantId: string): Promise<OnboardingRequest[]> {
    assertTenant(tenantId);
    const rows = await this.db.approval_requests.where('tenantId').equals(tenantId).toArray();
    return rows.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)) as OnboardingRequest[];
  }

  async submitGate1(request: any, tenantId: string): Promise<void> {
    const context = assertTenant(tenantId);
    const timestamp = now();
    const id = `${request.userId}_${timestamp}`;
    const payload: OnboardingRequest = { ...request, id, tenantId, status: 'pending', gateType: 'gate1', createdAt: timestamp, updatedAt: timestamp };
    await this.db.transaction('rw', [this.db.profile_update_requests, this.db.users, this.db.sync_queue], async () => {
      const duplicates = await this.db.profile_update_requests.where('tenantId').equals(tenantId).filter(r => r.userId === request.userId && r.status === 'pending').toArray();
      for (const duplicate of duplicates) await this.db.profile_update_requests.delete(duplicate.id);
      await this.db.profile_update_requests.put(payload);
      await this.db.users.update(request.userId, { status: 'pending_profile_approval', accountStatus: 'pending_profile_approval', updatedAt: timestamp });
    });
    for (const duplicate of await this.db.profile_update_requests.where('tenantId').equals(tenantId).filter(r => r.userId === request.userId && r.status === 'pending' && r.id !== id).toArray()) {
      await syncRepository.enqueue({ tenantId, collection: 'profile_update_requests', recordId: duplicate.id, operation: 'delete', payload: { id: duplicate.id, tenantId, deleted: true, deletedAt: timestamp } }, context, { triggerSync: false });
    }
    await syncRepository.enqueue({ tenantId, collection: 'profile_update_requests', recordId: id, operation: 'create', payload }, context, { triggerSync: false });
    await syncRepository.enqueue({ tenantId, collection: 'users', recordId: request.userId, operation: 'update', payload: { id: request.userId, tenantId, status: 'pending_profile_approval', accountStatus: 'pending_profile_approval', updatedAt: timestamp } }, context, { triggerSync: false });
  }

  async submitGate2(userId: string, targetId: string, role: 'siswa' | 'guru', details: any, tenantId: string): Promise<void> {
    const context = assertTenant(tenantId);
    const timestamp = now();
    const id = `${userId}_gate2_${timestamp}`;
    const payload: OnboardingRequest = { id, userId, gateType: 'gate2', status: 'pending', email: details.email || '', role, displayName: details.displayName || '', tenantId, formData: { targetId, verifiedDataName: details.verifiedDataName || null, existsInMaster: details.existsInMaster || false }, createdAt: timestamp, updatedAt: timestamp };
    await this.db.transaction('rw', [this.db.approval_requests, this.db.users], async () => {
      await this.db.users.update(userId, { status: 'pending_data_approval', accountStatus: 'pending_data_approval', updatedAt: timestamp });
      await this.db.approval_requests.put(payload);
    });
    await syncRepository.enqueue({ tenantId, collection: 'users', recordId: userId, operation: 'update', payload: { id: userId, tenantId, status: 'pending_data_approval', accountStatus: 'pending_data_approval', updatedAt: timestamp } }, context, { triggerSync: false });
    await syncRepository.enqueue({ tenantId, collection: 'approval_requests', recordId: id, operation: 'create', payload }, context, { triggerSync: false });
  }

  async resolve(requestId: string, status: 'approved' | 'rejected', adminNote: string | undefined, fallbackRequest: OnboardingRequest | undefined, tenantId: string): Promise<void> {
    const context = assertTenant(tenantId);
    const timestamp = now();
    const gate2 = requestId.includes('_gate2_');
    const requestTable = gate2 ? this.db.approval_requests : this.db.profile_update_requests;
    const request = (await requestTable.get(requestId) || fallbackRequest) as OnboardingRequest | undefined;
    if (!request) throw new Error('ONBOARDING_REQUEST_NOT_FOUND');
    if (request.tenantId !== tenantId) throw new Error('ONBOARDING_TENANT_MISMATCH');
    if (request.status !== 'pending') throw new Error('ONBOARDING_REQUEST_ALREADY_PROCESSED');
    const targetId = String(request.formData?.targetId || request.formData?.idUnik || request.formData?.nisn || request.formData?.nip || request.userId);
    const collectionName = request.role === 'siswa' ? 'students' : 'teachers';
    const userPatch: any = status === 'approved' ? { id: request.userId, tenantId, status: 'active', accountStatus: 'active', referenceId: targetId, idUnik: targetId, isClaimed: true, updatedAt: timestamp } : { id: request.userId, tenantId, status: 'rejected', accountStatus: 'rejected', adminNote: adminNote || 'Pengajuan profil ditolak oleh admin', updatedAt: timestamp };
    if (status === 'approved') {
      if (request.role === 'siswa') { userPatch.studentsId = targetId; userPatch.studentId = targetId; }
      if (request.role === 'guru' || request.role === 'wali_kelas') { userPatch.teachersId = targetId; userPatch.teacherId = targetId; }
    }
    const requestPatch = { ...request, status, adminNote: adminNote || '', updatedAt: timestamp };
    await this.db.transaction('rw', [requestTable, this.db.users, this.db.table(collectionName)], async () => {
      await requestTable.put(requestPatch);
      await this.db.users.update(request.userId, userPatch);
      if (status === 'approved') {
        const masterPayload = request.gateType === 'gate2' ? { sistemJangkar: { userId: request.userId }, updatedAt: timestamp } : { ...request.formData, idUnik: targetId, tenantId, statusAktif: true, sistemJangkar: { userId: request.userId }, createdAt: timestamp, updatedAt: timestamp, ...(request.role === 'siswa' ? { status: 'Aktif' } : {}) };
        await this.db.table(collectionName).put({ id: targetId, ...masterPayload });
      }
    });
    await syncRepository.enqueue({ tenantId, collection: gate2 ? 'approval_requests' : 'profile_update_requests', recordId: requestId, operation: 'update', payload: requestPatch }, context, { triggerSync: false });
    await syncRepository.enqueue({ tenantId, collection: 'users', recordId: request.userId, operation: 'update', payload: userPatch }, context, { triggerSync: false });
    if (status === 'approved') {
      const masterPayload = request.gateType === 'gate2' ? { id: targetId, tenantId, sistemJangkar: { userId: request.userId }, updatedAt: timestamp } : { id: targetId, ...request.formData, idUnik: targetId, tenantId, statusAktif: true, sistemJangkar: { userId: request.userId }, createdAt: timestamp, updatedAt: timestamp, ...(request.role === 'siswa' ? { status: 'Aktif' } : {}) };
      await syncRepository.enqueue({ tenantId, collection: collectionName, recordId: targetId, operation: 'update', payload: masterPayload }, context, { triggerSync: false });
    }
  }

  subscribePending(tenantId: string, onUpdate: (requests: OnboardingRequest[]) => void, onError?: (error: unknown) => void): () => void {
    const context = assertTenant(tenantId);
    const subscription = liveQuery(() => this.listPending(tenantId)).subscribe({ next: onUpdate, error: onError });
    void context;
    return () => subscription.unsubscribe();
  }
}

export const onboardingRepository = new OnboardingRepository();

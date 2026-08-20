import { useUserStore } from '@/stores/userStore';
import { firestoreGateway as dbGateway } from './gateways/FirestoreGateway';
import { db } from './firebase';
import { generateManualId } from '@/utils/firestoreHelpers';

export interface DataSubmission {
  userId: string;
  referenceId?: string;
  updateFields: {
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    tenantId?: string;
    role?: string;
    roles?: string[];
  };
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  tenantId: string;
}

export const submitDataRequest = async (userId: string, data: any, referenceId?: string) => {
  try {
    const tenantId = useUserStore.getState().tenantId;
    if (!tenantId) throw new Error('tenantId required');

    // Deterministic ID: ${tenantId}_update_${userId}_${timestamp}
    const manualId = generateManualId(`${tenantId}_update_${userId}`);

    await dbGateway.setDoc(dbGateway.doc(db!, 'data_submissions', manualId), {
      id: manualId,
      userId,
      referenceId,
      updateFields: {
        displayName: data.displayName || null,
        email: data.email || null,
        phoneNumber: data.phone || null,
        tenantId: data.tenantId || null,
        role: data.role || null,
        roles: data.roles || null,
      },
      note: data.note || null,
      status: 'pending',
      createdAt: dbGateway.serverTimestamp(),
      tenantId: tenantId,
    });
    return manualId;
  } catch (error) {
    console.error('Error submitting data request:', error);
    throw error;
  }
};

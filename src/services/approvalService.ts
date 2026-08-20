import type { ClassApprovalRequest } from '@/types';
import { approvalRepository } from '@/repositories/approvalRepository';
import { classRepository } from '@/repositories/classRepository';
import { generateManualId } from '../utils/firestoreHelpers';

export const submitClassApprovalRequest = async (
  request: Omit<ClassApprovalRequest, 'id' | 'createdAt' | 'status'>,
) => {
  const tenantId = request.tenantId;
  const manualId = generateManualId(`${tenantId}_class_approval_${request.userId}`);

  const payload: any = {
    ...request,
    id: manualId,
    status: 'pending',
  };
  await approvalRepository.createRequest(payload);
  return { id: manualId };
};

export const getPendingClassApprovalRequests = async (tenantId: string) => {
  return await approvalRepository.getPendingRequests(tenantId);
};

export const approveClassRequest = async (
  requestId: string,
  classId: string,
  updates: any,
  tenantId: string,
) => {
  // 1. Update the class document
  await classRepository.update({ ...updates, id: classId, tenantId } as any);

  // 2. Update the approval request status
  await approvalRepository.approveRequest(requestId, tenantId);
};

export const rejectClassRequest = async (requestId: string, tenantId: string) => {
  await approvalRepository.rejectRequest(requestId, tenantId);
};

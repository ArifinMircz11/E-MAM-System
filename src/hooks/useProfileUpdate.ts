import { useCallback, useState } from 'react';
import { useAutoFix } from './useAutoFix';
import * as ProfileRequestService from '@/services/profileRequestService';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';

export const useProfileUpdate = () => {
  const { safeCall } = useAutoFix();
  const { user } = useAuthStore();
  const uid = user?.uid;
  const { tenantId } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = useCallback(
    async (
      studentId: string,
      studentsId: string,
      displayName: string,
      nisn: string,
      requestedChanges: any,
    ) => {
      if (!uid) throw new Error('User unauthorized');

      setIsSubmitting(true);
      try {
        return await safeCall(async () => {
          await ProfileRequestService.requestProfileUpdate(
            uid,
            studentId,
            studentsId,
            displayName,
            nisn,
            requestedChanges,
            tenantId || 'default',
          );
        }, 'ProfileUpdate.submitRequest');
      } finally {
        setIsSubmitting(false);
      }
    },
    [safeCall, uid, tenantId],
  );

  return { submitRequest, isSubmitting };
};

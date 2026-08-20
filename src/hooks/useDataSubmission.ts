import { useState, useCallback } from 'react';
import { submitDataRequest } from '../services/dataSubmissionService';
import { toast } from 'sonner';

export const useDataSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async (userId: string, data: any, referenceId?: string) => {
    setIsSubmitting(true);
    try {
      await submitDataRequest(userId, data, referenceId);
      toast.success('Pengajuan berhasil dikirim.', {
        description:
          'Silakan hubungi Admin/Developer via WA: 6285194030064 untuk mempercepat proses persetujuan.',
        duration: 10000,
      });
      return true;
    } catch (err: any) {
      toast.error('Gagal mengirim data: ' + err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting };
};

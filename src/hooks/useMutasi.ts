import { useState, useCallback } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

export function useMutasi() {
  const [mutasi, setMutasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { safeCall } = useAutoFix();

  const fetchMutasi = useCallback(async () => {
    setLoading(true);
    await safeCall(async () => {
      const context = getSecurityContext();
      const students = await studentRepository.getAll(context);
      const filtered = students.filter((s: any) => s.status === 'Mutasi');
      setMutasi(filtered);
    }, 'Mutasi.Fetch');
    setLoading(false);
  }, [safeCall]);

  return { mutasi, loading, fetchMutasi };
}


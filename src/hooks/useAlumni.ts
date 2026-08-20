import { useState, useCallback } from 'react';
import { useAutoFix } from '@/hooks/useAutoFix';
import { studentRepository } from '@/features/students/repositories/StudentRepository';
import { getSecurityContext } from '@/core/security/contextHelper';

export function useAlumni() {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { safeCall } = useAutoFix();

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    await safeCall(async () => {
      const context = getSecurityContext();
      const students = await studentRepository.getAll(context);
      const filtered = students.filter((s: any) => s.status === 'Lulus');
      setAlumni(filtered);
    }, 'Alumni.Fetch');
    setLoading(false);
  }, [safeCall]);

  return { alumni, loading, fetchAlumni };
}


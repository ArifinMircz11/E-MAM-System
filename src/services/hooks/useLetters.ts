import { useUserStore } from '@/stores/userStore';
import { useState, useEffect, useCallback } from 'react';
import type { LetterRequest} from '@/types';
import { UserRole } from '@/types';
import { getLetters, getLettersByClass } from '@/services/letterService';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook useLetters untuk mengelola penarikan status pengajuan surat
 * menggunakan Local Cache (localStorage) untuk performa instan & minimalisasi baca Firestore.
 */
export const useLetters = (userRole: UserRole, canViewAll: boolean, isPublic: boolean = false) => {
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLetters = useCallback(
    async (forceRefresh = false) => {
      if (isPublic) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const tenantId = useUserStore.getState().tenantId;
        if (!tenantId) throw new Error('tenantId required');

        let data: LetterRequest[] = [];

        if (canViewAll) {
          // Use service with tenant filtering
          data = await getLetters(forceRefresh);
        } else if (userRole === UserRole.WALI_KELAS) {
          const classFilter = useAuthStore.getState().user?.walasOfClass;
          if (classFilter) {
            data = await getLettersByClass(classFilter, forceRefresh);
          } else {
            data = await getLetters(forceRefresh);
          }
        } else {
          data = await getLetters(forceRefresh);
        }

        const sortedData = [...data].sort((a, b) => {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        });

        setLetters(sortedData);
        setError(null);
      } catch (err: any) {
        console.error('[useLetters] Error fetching letters:', err?.message || 'Error');
        setError(err?.message || 'Gagal memuat data surat.');
      } finally {
        setLoading(false);
      }
    },
    [userRole, canViewAll, isPublic],
  );

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  // Fungsi untuk me-invalidate cache secara manual (misal setelah buat/edit/hapus surat)
  const invalidateCache = useCallback(() => {
    fetchLetters(true);
  }, [fetchLetters]);

  return {
    letters,
    loading,
    error,
    refetch: () => fetchLetters(true),
    invalidateCache,
  };
};

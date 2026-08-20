import { useState, useEffect, useCallback } from 'react';
import { useSecurityContext } from '@/core/identity/security-context';
import { classService } from '../services/ClassService';
import type { IClassEntity } from '@/repositories/contracts/IClassRepository';
import type { ClassFormData } from '../schemas/class.schema';
import { useClassStore } from '../state/classStore';

export function useClasses(overrideContext?: any) {
  const securityContext = useSecurityContext();
  const effectiveContext = overrideContext || securityContext;
  const [items, setItems] = useState<IClassEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { filter, setSelectedClass, setModalOpen } = useClassStore();

  const loadClasses = useCallback(async () => {
    if (!effectiveContext) return;
    setLoading(true);
    setError(null);
    try {
      const data = await classService.getList(effectiveContext);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  }, [effectiveContext]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const createClass = async (formData: ClassFormData) => {
    if (!effectiveContext) throw new Error('No security context');
    setLoading(true);
    try {
      await classService.create(effectiveContext, formData);
      await loadClasses();
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClass = async (id: string, formData: ClassFormData) => {
    if (!effectiveContext) throw new Error('No security context');
    setLoading(true);
    try {
      await classService.update(effectiveContext, id, formData);
      await loadClasses();
      setModalOpen(false);
      setSelectedClass(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteClass = async (id: string) => {
    if (!effectiveContext) throw new Error('No security context');
    setLoading(true);
    try {
      await classService.delete(effectiveContext, id);
      await loadClasses();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (item.deleted) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      const matchName = item.namaKelas.toLowerCase().includes(q);
      const matchCode = item.kodeKelas.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    if (filter.tingkat && filter.tingkat !== 'all' && item.tingkat !== filter.tingkat) {
      return false;
    }
    if (filter.academicYearId && filter.academicYearId !== 'all' && (item as any).academicYearId !== filter.academicYearId && item.tahunAjaran !== filter.academicYearId) {
      return false;
    }
    if (filter.status && filter.status !== 'all' && item.status !== filter.status) {
      return false;
    }
    return true;
  });

  return {
    classes: filteredItems,
    rawClasses: items,
    loading,
    error,
    refresh: loadClasses,
    createClass,
    updateClass,
    deleteClass,
  };
}

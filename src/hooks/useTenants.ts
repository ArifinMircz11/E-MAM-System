import { useState, useCallback, useEffect } from 'react';
import type { TenantData } from '@/types';
import {
  getTenants,
  createTenant,
  updateTenant,
  setTenantStatus,
  resetTenant,
  cloneTenant,
} from '@/services/tenantService';
import { toast } from 'sonner';

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<TenantData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTenants();
      setOrganizations(data);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data madrasah');
      toast.error('Gagal mengambil data madrasah');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreate = async (id: string, data: Partial<TenantData>) => {
    setIsSubmitting(true);
    try {
      await createTenant(id, data);
      toast.success('Madrasah berhasil ditambahkan');
      await fetchOrganizations();
    } catch (err: any) {
      toast.error('Gagal menambahkan madrasah');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<TenantData>) => {
    setIsSubmitting(true);
    try {
      await updateTenant(id, data);
      toast.success('Pengaturan madrasah berhasil diperbarui');
      await fetchOrganizations();
    } catch (err: any) {
      toast.error('Gagal memperbarui madrasah');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'Active' | 'Inactive' | 'Suspended') => {
    setIsSubmitting(true);
    try {
      await setTenantStatus(id, status);
      toast.success(`Status madrasah berhasil diubah menjadi ${status}`);
      await fetchOrganizations();
    } catch (err: any) {
      toast.error('Gagal mengubah status madrasah');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin mereset tenant ini? Akses akan dibatasi sementara.'))
      return;
    setIsSubmitting(true);
    try {
      await resetTenant(id);
      toast.success('Prosedur reset berhasil dipicu');
      await fetchOrganizations();
    } catch (err: any) {
      toast.error('Gagal mereset tenant');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClone = async (sourceId: string, targetId: string, newName: string) => {
    setIsSubmitting(true);
    try {
      await cloneTenant(sourceId, targetId, newName);
      toast.success(`Berhasil mengkloning madrasah ke ${targetId}`);
      await fetchOrganizations();
    } catch (err: any) {
      toast.error('Gagal mengkloning madrasah');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    isLoading,
    isSubmitting,
    error,
    refresh: fetchOrganizations,
    create: handleCreate,
    update: handleUpdate,
    setStatus: handleStatusChange,
    reset: handleReset,
    clone: handleClone,
  };
};

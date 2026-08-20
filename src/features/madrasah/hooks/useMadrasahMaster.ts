import { useEffect, useCallback } from 'react';
import { madrasahService } from '@/services/madrasahService';
import { useMadrasahStore } from '../state/madrasahStore';
import { useUserStore } from '@/stores/userStore';
import { MadrasahCreateInput } from '../types';
import { getSecurityContext } from '@/core/security/contextHelper';

export const useMadrasahMaster = () => {
  const { 
    madrasahs, 
    isLoading, 
    isFormOpen, 
    selectedMadrasah,
    setMadrasahs,
    setLoading,
    openForm,
    closeForm 
  } = useMadrasahStore();
  
  const { uid, tenantId, roles } = useUserStore();

  const loadMadrasahs = useCallback(async () => {
    setLoading(true);
    try {
      const ctx = getSecurityContext();
      const data = await madrasahService.getMadrasahs(ctx);
      setMadrasahs(data);
    } catch (error) {
      console.error('Failed to load madrasahs:', error);
    } finally {
      setLoading(false);
    }
  }, [setMadrasahs, setLoading]);

  const handleCreate = async (input: MadrasahCreateInput) => {
    try {
      const ctx = getSecurityContext();
      await madrasahService.createMadrasah(input, ctx);
      await loadMadrasahs();
      closeForm();
    } catch (error: any) {
      // Re-throw for the form to handle or log it
      console.error('Failed to create madrasah:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const ctx = getSecurityContext();
      await madrasahService.deleteMadrasah(id, ctx);
      await loadMadrasahs();
    } catch (error) {
      console.error('Failed to delete madrasah:', error);
    }
  };

  useEffect(() => {
    loadMadrasahs();
  }, [loadMadrasahs]);

  return {
    madrasahs,
    isLoading,
    isFormOpen,
    selectedMadrasah,
    openForm,
    closeForm,
    handleCreate,
    handleDelete,
    refresh: loadMadrasahs
  };
};
